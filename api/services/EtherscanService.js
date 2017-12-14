/**
 * EtherscanService
 *
 * description:: etherscan api service
 */

/* global sails MiscService KoraService */

// TODO; Remove 'rinkeby' after all logic implementation
const api = require('etherscan-api').init(sails.config.etherscanApiKey, 'rinkeby');

module.exports = {
  txlist,

  koraWalletTxlist: function ({startblock, endblock, sort}, cb) {
    let promise = KoraService.wallets()
      .then(({ETH}) => txlist({address: ETH, startblock, endblock, sort}));

    return MiscService.cbify(promise, cb);
  }
};

function txlist ({address, startblock, endblock, sort}, cb) {
  let promise = api.account.txlist(address, startblock, endblock, sort);

  return MiscService.cbify(promise, cb);
}
