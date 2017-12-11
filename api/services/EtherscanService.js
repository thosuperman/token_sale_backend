/**
 * EtherscanService
 *
 * description:: etherscan api service
 */

/* global sails MiscService */

// TODO; Remove 'rinkeby' after all logic implementation
const api = require('etherscan-api').init(sails.config.etherscanApiKey, 'rinkeby');

module.exports = {
  txlist: function ({address, startblock, endblock, sort}, cb) {
    let promise = api.account.txlist(address, startblock, endblock, sort);

    return MiscService.cbify(promise, cb);
  }
};
