/**
 * ValuesController
 *
 * @description :: Server-side logic for managing values
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Transactions ExchangeRates MiscService KoraService AuthenticatorService */

module.exports = {

  /**
   * `ValuesController.index()`
   */
  index: function (req, res) {
    let promises = [
      calcUserKNTBalance({userId: req.user.id}),
      fetchExchangeRates(),
      KoraService.saleValues({needDiscountMVP: req.user.isMVPUser})
    ];

    if (req.user.verified && req.user.enabled) {
      promises.push(fetchKoraWallets());
    }

    Promise.all(promises)
      .then(([KNTBalance, exchangeRates, saleValues, wallets]) => Object.assign({
        KNTBalance
      }, exchangeRates, saleValues, wallets))
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};

function calcUserKNTBalance ({userId}, cb) {
  let promise = Transactions.find({ from: userId })
    .then(records => {
      if (!records) {
        return 0;
      }

      return records.reduce((sum, tx) => {
        if (tx.KNT) {
          sum += tx.KNT;
        }

        return sum;
      }, 0);
    })
    .then(sum => +sum.toFixed(10));

  return MiscService.cbify(promise, cb);
}

function fetchExchangeRates (cb) {
  let promise = ExchangeRates.findLastByTypes()
    .then(exchangeRates => exchangeRates.reduce((previous, {type, USD}) => {
      previous[type + '_USD'] = USD;
      return previous;
    }, {}));

  return MiscService.cbify(promise, cb);
}

function fetchKoraWallets (cb) {
  let cache = {
    BTCWallet: {},
    ETHWallet: {}
  };

  let promise = KoraService.wallets()
    .then(({BTC, ETH}) => {
      cache.BTCWallet.address = BTC;
      cache.ETHWallet.address = ETH;

      return Promise.all([BTC, ETH].map(a => AuthenticatorService.generageQRCode(a)));
    })
    .then(([BTC, ETH]) => {
      cache.BTCWallet.qrcode = BTC;
      cache.ETHWallet.qrcode = ETH;

      return cache;
    });

  return MiscService.cbify(promise, cb);
}
