/**
 * JobsService
 * description:: Jobs for scheduler
 */

/* global sails Transactions EtherscanService ExchangeRates BitstampService KoraService BlockchainService */

module.exports = {
  copyTransactions: function () {
    sails.log.info(new Date().toISOString(), '-', 'Run copy transactions job');

    Promise.all([
      fetchEthTransactions(),
      fetchBtcTransactions()
    ])
      .then(([EthTxs, BtcTxs]) => {
        let txs = EthTxs.concat(BtcTxs);

        if (txs.length) {
          txs.sort((a, b) => (a.date.getTime() - b.date.getTime()));

          let records = [];

          // For correct calculation of TotalAmount
          let promise = txs.reduce((promise, tx) => promise
          .then(() => Transactions.create(tx))
          .then((record) => records.push(record)),
          Promise.resolve());

          return promise.then(() => records);
        }

        return [];
      })
      .then(records => sails.log.info(records.length, 'new transactions was created'))
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

function fetchEthTransactions () {
  sails.log.info(new Date().toISOString(), '-', 'Fetch ETH transactions ');

  const type = Transactions.constants.types.ETH;

  return Promise.all([
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
        .map(r => ({ type, raw: r, date: new Date(r.timeStamp * 1000) }));

      sails.log.info(txs.length, 'new ETH transactions was received');

      return txs;
    })
    .catch((err) => {
      if (err === 'No transactions found') {
        sails.log.info('0 new ETH transactions was received');

        return [];
      }

      return Promise.reject(err);
    });
}

function fetchBtcTransactions () {
  sails.log.info(new Date().toISOString(), '-', 'Fetch BTC transactions');

  const type = Transactions.constants.types.BTC;

  return Promise.all([
    KoraService.wallets(),
    Transactions.findLast({type}),
    BlockchainService.koraWalletTransactions({sortDir: 'desc'})
  ])
    .then(([{BTC: koraBitcoinWallet}, lastRecord, response]) => {
      let txs = response.data;

      // TODO: Update fetching of bitcoin txs to lastRecord with pages for case of unexpected situations
      if (lastRecord) {
        let lastIndex = txs.findIndex(tx => (tx.hash === lastRecord.hash));

        if (lastIndex !== -1) {
          txs = txs.slice(0, lastIndex);
        }
      }

      txs = txs
        .filter(tx => (
          Array.isArray(tx.outputs) && tx.outputs.find(o => o.address === koraBitcoinWallet) &&
          tx.confirmations >= 1
        ))
        .map(tx => {
          let output = tx.outputs.find(o => o.address === koraBitcoinWallet);

          // For look like etherscan transactions
          tx.from = tx.inputs[output.spent_index].address;
          tx.value = output.value;

          return { type, raw: tx, date: new Date(tx.time) };
        });

      txs.reverse();

      sails.log.info(txs.length, 'new BTC transactions was received');

      return txs;
    })
    .catch((err) => Promise.reject(err));
}

function copyExchangeRate ({currencyPair, type}) {
  return BitstampService.tickerHour({currencyPair})
    .then(result => ExchangeRates.create({type, raw: result}))
    .then(record => sails.log.info(record.date, type, 'hour ticker was received. USD:', record.USD))
    .catch((err) => sails.log.error(err));
}
