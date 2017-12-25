/**
 * BlockchainService
 *
 * description:: Bitcoin explorer service
 */

/* global sails MiscService KoraService */

const blocktrail = require('blocktrail-sdk');
const client = blocktrail.BlocktrailSDK({
  apiKey: sails.config.blocktrailApiKey,
  apiSecret: sails.config.blocktrailApiKeySecret,
  network: 'BTC',
  testnet: sails.config.blockchains.testnet
});

const blockexplorer = require('blockchain.info/blockexplorer');

if (sails.config.blockchains.testnet) {
  blockexplorer.usingNetwork(3);
}

module.exports = {
  addressTransactions,

  koraWalletTransactions: function ({page, limit, sortDir}, cb) {
    let promise = KoraService.wallets()
      .then(({BTC: address}) => addressTransactions({address, page, limit, sortDir}));

    return MiscService.cbify(promise, cb);
  },

  toBTC: blocktrail.toBTC.bind(this),

  // Add this for testing and maybe for future
  getAddress: function ({address}, cb) {
    let promise = blockexplorer.getAddress(address);

    return MiscService.cbify(promise, cb);
  }
};

function addressTransactions ({address, page = 1, limit = 200, sortDir = 'asc'}, cb) {
  let promise = client.addressTransactions(address, {page, limit, sortDir});

  return MiscService.cbify(promise, cb);
}
