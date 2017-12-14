/**
 * ValuesController
 *
 * @description :: Server-side logic for managing values
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Transactions ExchangeRates MiscService KoraService */

const qrcode = require('qrcode');

module.exports = {

  /**
   * `ValuesController.index()`
   */
  index: function (req, res) {
    Promise.all([
      calcUserKNTBalance({userId: req.user.id}),
      ExchangeRates.findLastByTypes(),
      KoraService.exchangeRates(),
      fetchKoraWallets()
    ])
      .then(([KNTBalance, exchangeRates, koraExchangeRates, wallets]) => {
        let result = exchangeRates.reduce((previous, {type, USD}) => {
          previous[type + '_USD'] = USD;

          return previous;
        }, {KNTBalance});

        Object.assign(result, koraExchangeRates, wallets);

        return result;
      })
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
        sum += tx.KNT;
        return sum;
      }, 0);
    })
    .then(sum => +sum.toFixed(10));

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

      return Promise.all([BTC, ETH].map(a => generageQRCode(a)));
    })
    .then(([BTC, ETH]) => {
      cache.BTCWallet.qrcode = BTC;
      cache.ETHWallet.qrcode = ETH;

      return cache;
    });

  return MiscService.cbify(promise, cb);
}

function generageQRCode (text, cb) {
  let promise = new Promise((resolve, reject) =>
    qrcode.toDataURL(text, (err, url) => {
      if (err) {
        return reject(err);
      }

      return resolve(url);
    }));

  return MiscService.cbify(promise, cb);
}
