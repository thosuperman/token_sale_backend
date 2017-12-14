/**
 * KoraService
 * @description :: Kora wallets and KNT exchange rates service (fake yet)
 */

/* global sails MiscService */

module.exports = {
  wallets: function (cb) {
    let promise = Promise.resolve({
      BTC: sails.config.koraBitcoinWallet,
      ETH: sails.config.koraEtherWallet
    });

    return MiscService.cbify(promise, cb);
  },

  exchangeRates: function (cb) {
    let promise = Promise.resolve({
      KNT_USD: sails.config.koraExchangeRate
    });

    return MiscService.cbify(promise, cb);
  }
};
