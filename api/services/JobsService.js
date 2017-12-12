/**
 * JobsService
 * description:: Jobs for scheduler
 */

/* global sails Transactions EtherscanService */

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
          .filter(tx => +tx.value)
          .map(r => ({type, raw: r}));

        return Transactions.create(txs);
      })
      .then(records => sails.log.info(records.length, 'new ETH transactions was received'))
      .catch((err) => sails.log.error(err));
  }
};
