/**
 * RegistrationController
 *
 * @description :: Server-side logic for managing registrations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails _ User */

const request = require('request');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const geoip = require('geoip-country');

const captchaErrors = {
  'missing-input-secret': 'The secret parameter is missing',
  'invalid-input-secret': 'The secret parameter is invalid or malformed',
  'missing-input-response': 'The response parameter is missing',
  'invalid-input-response': 'The response parameter is invalid or malformed',
  'bad-request': 'The request is invalid or malformed'
};

module.exports = {

  /**
   * `RegistrationController.checkUserInfo()`
   */
  checkUserInfo: function (req, res) {
    let {userName, email, phone, ethereumAddress} = req.allParams();

    if ([userName, email, phone, ethereumAddress].every(p => !p)) {
      return res.badRequest({
        message: 'Some of userName, email, phone, ethereumAddress parameters must be set'
      });
    }

    let temp = {userName, email, phone, ethereumAddress};
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
              previous[key] = [{message: `User whitch such ${key} is already exists`}];
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
   * `RegistrationController.validateCaptcha()`
   * Google Captcha Validation Action
   * @description :: Server-side logic to validate captcha with google recaptcha api
   */
  validateCaptcha: function (req, res) {
    let responseText = req.param('response');
    sails.log.debug('Validate Captcha response: ', JSON.stringify(responseText));

    request({
      uri: 'https://www.google.com/recaptcha/api/siteverify',
      qs: {secret: sails.config.captchaSecret, response: responseText},
      method: 'POST'
    }, function (err, response, body) {
      if (err) {
        return res.negotiate(err);
      }

      sails.log.debug(response.statusCode, body);

      let apiResponse = JSON.parse(body);
      let errorCodes = apiResponse['error-codes'] || [];

      req.session.isCaptchaValid = apiResponse.success;

      if (!apiResponse.success) {
        return res.badRequest({
          message: 'ReCaptcha validation failure',
          Errors: {captcha: errorCodes.map(code => ({message: captchaErrors[code]}))}
        });
      }

      return res.ok({message: 'ReCaptcha validation success'});
    });
  },

  /**
   * `RegistrationController.checkIp()`
   */
  checkIp: function (req, res) {
    let geo = geoip.lookup(req.ip);

    req.session.ipChecked = true;

    if (geo) {
      req.session.isUSIp = (geo.country === 'US');
    }

    return res.ok({isUSIp: req.session.isUSIp, ip: req.ip, geo});
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

    if (!req.session.isCaptchaValid) {
      return res.badRequest({
        message: `User didn't pass reCaptcha validation`
      });
    }

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
        delete req.session.isCaptchaValid;
        delete req.session.twoFactorSecret;

        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
