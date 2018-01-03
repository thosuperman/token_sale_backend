/**
 * AuthenticatorService
 * @description :: Google Authenticator functions
 */

/* global MiscService */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

module.exports = {
  generateSecret: function () {
    return speakeasy.generateSecret({name: 'Kora'});
  },

  verify: function (secret, token) {
    return speakeasy.totp.verify({ secret, token, encoding: 'base32' });
  },

  generageQRCode: function (text, cb) {
    let promise = new Promise((resolve, reject) => qrcode.toDataURL(text, (err, url) => {
      if (err) {
        return reject(err);
      }

      return resolve(url);
    }));

    return MiscService.cbify(promise, cb);
  }
};
