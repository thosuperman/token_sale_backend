/**
 * JobsService
 * description:: Jobs for scheduler
 */

/* global sails Transactions EtherscanService ExchangeRates BitstampService */

const koraEtherWallet = sails.config.koraEtherWallet.toLowerCase();

module.exports = {
  copyEthTransactions: function () {
    sails.log.info(new Date().toISOString(), '-', 'Run copy ETH transactions job');

    const type = Transactions.constants.types.ETH;

    Transactions.findLast({type})
      .then(tx => {
        let startblock = tx ? +tx.raw.blockNumber + 1 : 0;

        return EtherscanService.koraWalletTxlist({startblock});
      })
      .then(response => {
        let txs = response.result
          .filter(tx => (+tx.value && tx.to.toLowerCase() === koraEtherWallet))
          .map(r => ({type, raw: r}));

        return Transactions.create(txs);
      })
      .then(records => sails.log.info(records.length, 'new ETH transactions was received'))
      .catch((err) => {
        if (err === 'No transactions found') {
          sails.log.info(err);
        } else {
          sails.log.error(err);
        }
      });
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
