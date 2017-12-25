/**
 * JobsService
 * description:: Jobs for scheduler
 */

/* global sails Transactions EtherscanService ExchangeRates BitstampService KoraService BlockchainService */

module.exports = {
  copyEthTransactions: function () {
    sails.log.info(new Date().toISOString(), '-', 'Run copy ETH transactions job');

    const type = Transactions.constants.types.ETH;

    Promise.all([
      KoraService.wallets(),
      Transactions.findLast({type})
      .then(tx => {
        let startblock = tx ? +tx.raw.blockNumber + 1 : 0;

        return EtherscanService.koraWalletTxlist({startblock});
      })
    ])
      .then(([{ETH}, response]) => {
        const koraEtherWallet = ETH.toLowerCase();

        let txs = response.result
          .filter(tx => (+tx.value && tx.to.toLowerCase() === koraEtherWallet))
          .map(r => ({type, raw: r}));

        let records = [];

        // For correct calculation of TotalAmount
        let promise = txs.reduce((promise, tx) => promise
          .then(() => Transactions.create(tx))
          .then((record) => records.push(record)),
          Promise.resolve());

        return promise.then(() => records);
      })
      .then(records => sails.log.info(records.length, 'new ETH transactions was received'))
      .catch((err) => {
        if (err === 'No transactions found') {
          sails.log.info('No new ETH transactions found');
        } else {
          sails.log.error(err);
        }
      });
  },

  copyBtcTransactions: function () {
    sails.log.info(new Date().toISOString(), '-', 'Run copy BTC transactions job');

    const type = Transactions.constants.types.BTC;

    Promise.all([
      KoraService.wallets(),
      Transactions.findLast({type}),
      BlockchainService.koraWalletTransactions({sortDir: 'desc'})
    ])
      .then(([{BTC: koraBitcoinWallet}, lastRecord, response]) => {
        let txs = response.data;

        if (lastRecord) {
          let lastIndex = txs.findIndex(tx => (tx.hash === lastRecord.hash));

          txs = txs.slice(0, lastIndex);
        }

        txs = txs
          .filter(tx => (
            Array.isArray(tx.inputs) && tx.inputs[0] && tx.inputs[0].address !== koraBitcoinWallet &&
            tx.confirmations >= 1
          ))
          .map(r => {
            r.from = r.inputs[0].address;
            r.value = r.outputs[r.inputs[0].output_index].value;

            return { type, raw: r };
          });

        txs.reverse();

        let records = [];

        // For correct calculation of TotalAmount
        let promise = txs.reduce((promise, tx) => promise
          .then(() => Transactions.create(tx))
          .then((record) => records.push(record)),
          Promise.resolve());

        return promise.then(() => records);
      })
      .then(records => sails.log.info(records.length, 'new BTC transactions was received'))
      .catch((err) => sails.log.error(err));
  },

  copyExchangeRates: function () {
    sails.log.info(new Date().toISOString(), '-', 'Run copy exchange rates job');

    const currencyPairs = BitstampService.constants.currencyPairs;
    const types = ExchangeRates.constants.types;

    Promise.all(
      [
        {
          currencyPair: currencyPairs.btcusd,
          type: types.BTC
        }, {
          currencyPair: currencyPairs.ethusd,
          type: types.ETH
        }
      ].map(opts => copyExchangeRate(opts))
    )
      .catch((err) => sails.log.error(err));
  }
};

function copyExchangeRate ({currencyPair, type}) {
  return BitstampService.tickerHour({currencyPair})
    .then(result => ExchangeRates.create({type, raw: result}))
    .then(record => sails.log.info(record.date, type, 'hour ticker was received. USD:', record.USD))
    .catch((err) => sails.log.error(err));
}
