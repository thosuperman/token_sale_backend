/**
 * RegistrationController
 *
 * @description :: Server-side logic for managing registrations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

module.exports = {

  /**
   * `RegistrationController.userInfo()`
   */
  userInfo: function (req, res) {
    let allParams = req.allParams();

    // if (allParams.password !== allParams.confirmPassword) {
    //   return res.badRequest({message: 'Password doesn\'t match, What a shame!'})
    // }
    //
    // delete allParams.confirmPassword

    User.create(allParams)
      .then(user => {
        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `RegistrationController.ethereumAddress()`
   */
  ethereumAddress: function (req, res) {
    let allParams = req.allParams();
    const {ethereumAddress} = allParams;

    User.update({id: req.user.id}, {ethereumAddress})
      .then(records => {
        if (records && records[0]) {
          req.user = records[0];
        } else {
          let err = new Error('User was not update in db');
          err.status = 400;
          return Promise.reject(err);
        }

        return req.user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `RegistrationController.generateQRCode()`
   */
  generateQRCode: function (req, res) {
    if (req.user.enabled) {
      return res.badRequest({
        message: 'Two factor authentication already enabled for user'
      });
    }

    const secret = speakeasy.generateSecret();

    User.update({id: req.user.id}, {twoFactorSecret: secret.base32})
      .then(records => {
        if (records && records[0]) {
          req.user = records[0];
        } else {
          let err = new Error('User was not update in db');
          err.status = 400;
          return Promise.reject(err);
        }

        return new Promise((resolve, reject) => qrcode.toDataURL(secret.otpauth_url, (err, url) => {
          if (err) {
            return reject(err);
          }

          return resolve(url);
        }));
      })
      .then(url => ({
        qrcode: url,
        key: secret.base32
      }))
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `RegistrationController.confirmQRCode()`
   */
  confirmQRCode: function (req, res) {
    return res.json({
      todo: 'confirmQRCode() is not implemented yet!'
    });
  }
};
