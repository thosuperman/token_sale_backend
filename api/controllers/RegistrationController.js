/**
 * RegistrationController
 *
 * @description :: Server-side logic for managing registrations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global _ User */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

module.exports = {

  /**
   * `RegistrationController.checkUserInfo()`
   */
  checkUserInfo: function (req, res) {
    let {userName, email, phone} = req.allParams();

    if ([userName, email, phone].every(p => !p)) {
      return res.badRequest({
        message: 'Some of userName, email, phone parameters must be set'
      });
    }

    let temp = {userName, email, phone};
    let allParams = Object.keys(temp).reduce((result, el) => {
      if (temp[el]) {
        result[el] = temp[el].toLowerCase();
      }
      return result;
    }, {});
    let allParamsKeys = Object.keys(allParams);

    User.validate(allParams, err => {
      if (err && err.Errors) {
        let errors = _.pick(err.Errors, allParamsKeys);

        if (!_.isEmpty(errors)) {
          return res.badRequest({Errors: errors});
        }
      }

      return Promise.all(
        allParamsKeys.map(key => User.findOne({[key]: allParams[key]}))
      )
        .then(results => {
          if (results.every(r => !r)) {
            return {message: `No users with ${allParamsKeys.join(', ')} attributes`};
          }

          let err = new Error(`User with some of ${allParamsKeys.join(', ')} attributes is already exists`);

          err.status = 400;

          err.Errors = results.reduce((previous, current, index) => {
            if (current) {
              let key = allParamsKeys[index];
              previous[key] = {message: `User whitch such ${key} is already exists`};
            }

            return previous;
          }, {});

          return Promise.reject(err);
        })
        .then(result => res.ok(result))
        .catch(err => res.negotiate(err));
    });
  },

  /**
   * `RegistrationController.generateQRCode()`
   */
  generateQRCode: function (req, res) {
    if (req.user && req.user.enabled) {
      return res.badRequest({
        message: 'Looks like user is already registered. Logout first'
      });
    }

    const secret = speakeasy.generateSecret();

    return new Promise((resolve, reject) => qrcode.toDataURL(secret.otpauth_url, (err, url) => {
      if (err) {
        return reject(err);
      }

      req.session.twoFactorSecret = secret.base32;

      return resolve(url);
    }))
      .then(url => ({
        qrcode: url,
        key: secret.base32
      }))
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `RegistrationController.confirm()`
   */
  confirm: function (req, res) {
    const twoFactorSecret = req.session.twoFactorSecret;

    if (!twoFactorSecret) {
      return res.badRequest({
        message: 'User do not have generated secret QR Code'
      });
    }

    let allParams = req.allParams();
    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret,
      encoding: 'base32',
      token: allParams.token
    });

    if (!verified) {
      return res.badRequest({
        message: 'Token verification fails'
      });
    }

    // if (allParams.password !== allParams.confirmPassword) {
    //   return res.badRequest({message: 'Password doesn\'t match, What a shame!'})
    // }
    //
    // delete allParams.confirmPassword

    delete allParams.role;

    Object.assign(allParams, {twoFactorSecret});

    User.create(allParams)
      .then(user => {
        delete req.session.twoFactorSecret;
        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
