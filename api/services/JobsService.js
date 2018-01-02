/**
 * JobsService
 * description:: Jobs for scheduler
 */

/* global _ sails Transactions EtherscanService ExchangeRates BitstampService KoraService BlockchainService */

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
            .then(() => {
              if (tx.needUpdate) {
                return Transactions.update({hash: tx.hash}, tx);
              }

              return Transactions.create(tx);
            })
            .then((record) => records.push(record)),
            Promise.resolve());

          return promise.then(() => _.flatten(records));
        }

        return [];
      })
      .then(records => sails.log.info(records.length, 'transactions was created/updated'))
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
  let cache = {};

  return Promise.all([
    KoraService.wallets(),
    Promise.all([
      Transactions.findLast({type}),
      Transactions.findNotConfirmed({type})
    ])
      .then(([lastTx, notConfirmedTxs]) => {
        cache.notConfirmedTxs = notConfirmedTxs;

        let startblock = 0;

        if (notConfirmedTxs.length) {
          startblock = notConfirmedTxs[notConfirmedTxs.length - 1].raw.blockNumber;
        } else if (lastTx) {
          startblock = +lastTx.raw.blockNumber + 1;
        }

        return EtherscanService.koraWalletTxlist({startblock});
      })
  ])
    .then(([{ETH}, response]) => {
      const koraEtherWallet = ETH.toLowerCase();

      let txs = response.result
        .filter(tx => (+tx.value && tx.to.toLowerCase() === koraEtherWallet))
        .map(tx => ({
          type,
          raw: tx,
          date: new Date(tx.timeStamp * 1000),
          hash: tx.hash,
          needUpdate: cache.notConfirmedTxs ? !!cache.notConfirmedTxs.find(el => el.hash === tx.hash) : false
        }));

      sails.log.info(
        txs.length - cache.notConfirmedTxs.length,
        'new and',
        cache.notConfirmedTxs.length,
        'not confirmed ETH transactions was received'
      );

      return txs;
    })
    .catch((err) => {
      if (err === 'No transactions found') {
        sails.log.info('0 new and 0 not confirmed ETH transactions was received');

        return [];
      }

      return Promise.reject(err);
    });
}

function fetchBtcTransactions () {
  sails.log.info(new Date().toISOString(), '-', 'Fetch BTC transactions');

  const type = Transactions.constants.types.BTC;
  let cache = {};

  return Promise.all([
    KoraService.wallets(),
    Promise.all([
      Transactions.findLast({type}),
      Transactions.findNotConfirmed({type})
    ])
      .then(([lastTx, notConfirmedTxs]) => {
        cache.notConfirmedTxs = notConfirmedTxs;

        const limit = 200; // max == 200
        let page = 1;
        let txs = [];
        let lastRecord = notConfirmedTxs.length ? notConfirmedTxs[notConfirmedTxs.length - 1] : lastTx;

        let recursiveFetch = () => BlockchainService.koraWalletTransactions({page, limit, sortDir: 'desc'})
          .then(response => {
            if (lastRecord) {
              let lastIndex = response.data.findIndex(tx => (tx.hash === lastRecord.hash));

              if (lastIndex !== -1) {
                txs.push.apply(txs, response.data.slice(0, notConfirmedTxs.length ? lastIndex + 1 : lastIndex));

                return txs;
              }
            }

            txs.push.apply(txs, response.data);

            if (page * limit <= response.total) {
              page++;
              return recursiveFetch();
            }

            return txs;
          });

        return recursiveFetch();
      })
  ])
    .then(([{BTC: koraBitcoinWallet}, txs]) => {
      txs = txs
        .filter(tx => Array.isArray(tx.outputs) && tx.outputs.find(o => o.address === koraBitcoinWallet))
        .map(tx => {
          let output = tx.outputs.find(o => o.address === koraBitcoinWallet);

          // For look like etherscan transactions
          tx.from = tx.inputs[output.spent_index].address;
          tx.value = output.value;

          return {
            type,
            raw: tx,
            date: new Date(tx.time),
            hash: tx.hash,
            needUpdate: cache.notConfirmedTxs ? !!cache.notConfirmedTxs.find(el => el.hash === tx.hash) : false
          };
        });

      txs.reverse();

      sails.log.info(
        txs.length - cache.notConfirmedTxs.length,
        'new and',
        cache.notConfirmedTxs.length,
        'not confirmed BTC transactions was received'
      );

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
