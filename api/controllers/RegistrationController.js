/**
 * RegistrationController
 *
 * @description :: Server-side logic for managing registrations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails _ User ValidationService AuthenticatorService */

const request = require('request');
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
   * `RegistrationController.sendMVPCode()`
   */
  sendMVPCode: function (req, res) {
    const userName = ValidationService.escape(req.param('userName'));

    if (!userName) {
      return res.badRequest({
        message: 'Username must be set'
      });
    }

    User.findOne({userName}).exec((err, user) => {
      if (err) {
        return res.negotiate(err);
      }

      if (user) {
        return res.badRequest({message: 'User with such Kora MVP username is already registered'});
      }

      request({
        uri: sails.config.mvp.baseURL + '/registrationICO/sendCode',
        qs: {userName},
        method: 'POST'
      }, (err, response, body) => {
        if (err) {
          return res.negotiate(err);
        }

        if (response.statusCode === 200) {
          req.session.isMVPCodeSent = true;
          req.session.userName = userName;
        }

        if (response.statusCode === 422) {
          response.statusCode = 400;
        }

        try {
          var parsedBody = JSON.parse(body);
        } catch (e) {
          return res.negotiate(e);
        }

        return res.json(response.statusCode, parsedBody);
      });
    });
  },

  /**
   * `RegistrationController.verifyMVPCode()`
   */
  verifyMVPCode: function (req, res) {
    const code = ValidationService.escape(req.param('code'));

    if (!req.session.isMVPCodeSent) {
      return res.badRequest({
        message: 'Verification code was not sent throught Kora MVP'
      });
    }

    if (!code) {
      return res.badRequest({
        message: 'Verification code must be set'
      });
    }

    request({
      uri: sails.config.mvp.baseURL + '/registrationICO/verifyCode',
      qs: {userName: req.session.userName, code},
      method: 'POST'
    }, (err, response, body) => {
      if (err) {
        return res.negotiate(err);
      }

      if (response.statusCode === 200) {
        req.session.isMVPCodeVerified = true;
      }

      if (response.statusCode === 422) {
        response.statusCode = 400;
      }

      try {
        var parsedBody = JSON.parse(body);
      } catch (e) {
        return res.negotiate(e);
      }

      return res.json(response.statusCode, parsedBody);
    });
  },

  /**
   * `RegistrationController.disableMVPCode()`
   */
  disableMVPCode: function (req, res) {
    delete req.session.isMVPCodeSent;
    delete req.session.isMVPCodeVerified;
    delete req.session.userName;

    return res.ok({
      message: 'Verification code throught Kora MVP is disabled'
    });
  },

  /**
   * `RegistrationController.validateCaptcha()`
   * Google Captcha Validation Action
   * @description :: Server-side logic to validate captcha with google recaptcha api
   */
  validateCaptcha: function (req, res) {
    let responseText = req.param('response');

    request({
      uri: 'https://www.google.com/recaptcha/api/siteverify',
      qs: {secret: sails.config.captchaSecret, response: responseText},
      method: 'POST'
    }, function (err, response, body) {
      if (err) {
        return res.negotiate(err);
      }

      try {
        var apiResponse = JSON.parse(body);
      } catch (e) {
        return res.badRequest(e);
      }

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

    const secret = AuthenticatorService.generateSecret();

    req.session.twoFactorSecret = secret.base32;

    return AuthenticatorService.generageQRCode(secret.otpauth_url)
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
    let allParams = req.allParams();
    const twoFactorSecret = req.session.twoFactorSecret;

    if (!req.session.isIPChecked) {
      return res.badRequest({
        message: `User didn't check his IP`
      });
    }

    // TODO: Check US citizens registration logic
    if (req.session.hasUSIP) {
      return res.badRequest({
        message: `User can't has US IP`
      });
    }

    if (allParams.country === 'USA') {
      return res.badRequest({
        message: `User can't has US country`
      });
    }

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

    if (req.session.isMVPCodeSent && !req.session.isMVPCodeVerified) {
      return res.badRequest({
        message: 'Verification code throught Kora MVP was sent but not verified'
      });
    }

    if (!AuthenticatorService.verify(twoFactorSecret, allParams.token)) {
      return res.badRequest({
        message: 'Google Authenticator Code is invalid or expired'
      });
    }

    // if (allParams.password !== allParams.confirmPassword) {
    //   return res.badRequest({message: 'Password doesn\'t match, What a shame!'})
    // }
    //
    // delete allParams.confirmPassword

    delete allParams.role;
    delete allParams.userName;

    Object.assign(allParams, {
      twoFactorSecret,
      registeredFromUSIP: req.session.hasUSIP,
      isMVPUser: false
    });

    if (req.session.isMVPCodeSent && req.session.isMVPCodeVerified) {
      Object.assign(allParams, {
        isMVPUser: true,
        userName: req.session.userName
      });
    }

    User.create(allParams)
      .then(user => {
        delete req.session.isCaptchaValid;
        delete req.session.isIPChecked;
        delete req.session.hasUSIP;
        delete req.session.twoFactorSecret;
        delete req.session.isMVPCodeSent;
        delete req.session.isMVPCodeVerified;
        delete req.session.userName;

        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  confirmEmail: function (req, res) {
    const token = req.param('token');

    User.findOne({emailVerificationToken: token})
      .then(user => {
        User.update({id: user.id}, {emailVerified: true})
          .then(result => res.ok(result))
      })
      .catch(err => res.notFound({message: 'No user with such token found'}))
  }
};
