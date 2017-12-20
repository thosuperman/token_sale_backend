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

const checkUserAttrsNamesHash = {
  userName: 'username',
  email: 'email',
  phone: 'phone number',
  sendingEthereumAddress: 'sending ethereum address',
  receivingEthereumAddress: 'receiving ethereum address',
  bitcoinAddress: 'bitcoin address'
};
const checkUserAttrs = Object.keys(checkUserAttrsNamesHash);
const checkUserAttrsNames = _.values(checkUserAttrsNamesHash);

module.exports = {

  /**
   * `RegistrationController.checkUserInfo()`
   */
  checkUserInfo: function (req, res) {
    let temp = _.pick(req.allParams(), checkUserAttrs);

    if (_.isEmpty(temp)) {
      return res.badRequest({
        message: `Some of ${checkUserAttrsNames.join(', ')} parameters must be set`
      });
    }

    let allParams = Object.keys(temp).reduce((result, el) => {
      result[el] = (el === 'bitcoinAddress') ? temp[el] : temp[el].toLowerCase();
      return result;
    }, {});

    let allParamsKeys = Object.keys(allParams);
    let allParamsNames = _.values(_.pick(checkUserAttrsNamesHash, allParamsKeys));
    let pluralize = allParamsKeys.length > 1;

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
            return {message: `No users with ${allParamsNames.join(', ')} attribute${pluralize ? 's' : ''}`};
          }

          let err = new Error(`User with ${pluralize ? 'some of' : 'such'} ${allParamsNames.join(', ')} attribute${pluralize ? 's' : ''} is already exists`);

          err.status = 400;

          err.Errors = results.reduce((previous, current, index) => {
            if (current) {
              let key = allParamsKeys[index];
              previous[key] = [{message: `User with such ${checkUserAttrsNamesHash[key]} is already exists`}];
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
    let hasUSIP = (geo && geo.country === 'US');

    req.session.isIPChecked = true;
    req.session.hasUSIP = hasUSIP;

    return res.ok({hasUSIP, ip: req.ip, geo});
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

    const secret = speakeasy.generateSecret({name: 'Kora'});

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

    if (!req.session.isIPChecked) {
      return res.badRequest({
        message: `User didn't check his IP`
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

    Object.assign(allParams, {twoFactorSecret, registeredFromUSIP: req.session.hasUSIP});

    User.create(allParams)
      .then(user => {
        delete req.session.isCaptchaValid;
        delete req.session.isIPChecked;
        delete req.session.hasUSIP;
        delete req.session.twoFactorSecret;

        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
