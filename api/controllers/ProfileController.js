/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails _ User Files CountriesService ErrorService MiscService MailerService AddressHistory */

const {blueprints} = require('../../config/blueprints');
const prefix = blueprints.prefix || '';

const skipperS3 = require('skipper-better-s3');
const skipperS3Adapter = skipperS3({
  key: sails.config.s3ApiKey,
  secret: sails.config.s3ApiSecret,
  bucket: sails.config.s3Bucket,
  region: sails.config.s3Region
});

const updateAttrs = ['email', 'sendingEthereumAddress', 'bitcoinAddress'];

const needVerifyNames = {
  'firstName': 'First Name',
  'lastName': 'Last Name',
  'phone': 'Phone Number',
  'country': 'Country',
  'dateOfBirth': 'Birthday',
  'streetAddress': 'Street Address',
  'city': 'City',
  'state': 'State',
  'zip': 'Zip',
  'identificationType': 'Identification Type',
  'documentCountry': 'Document Country'
};
const needVerifyAttrs = Object.keys(needVerifyNames);

module.exports = {

  /**
   * `ProfileController.index()`
   */
  index: function (req, res) {
    const user = _.clone(req.user);

    switch (req.method) {
      case 'GET':
        if (user.document) {
          user.documentUrl = `${prefix}/profile/document/${user.document}`;
          delete user.document;
        }

        return res.json(user);

      case 'PUT':
        let allParams = _.pick(req.allParams(), updateAttrs);

        // if (!allParams.token) {
        //   return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
        // }

        // if (!AuthenticatorService.verify(req.user.twoFactorSecret, allParams.token)) {
        //   return res.badRequest({
        //     message: 'Google Authenticator Code is expired or invalid'
        //   });
        // }

        allParams = Object.keys(allParams).reduce((result, el) => {
          result[el] = (el === 'bitcoinAddress') ? allParams[el] : allParams[el].toLowerCase();
          return result;
        }, {});

        allParams = _.pick(allParams, (value, key) => (user[key] !== value));

        if (_.isEmpty(allParams)) {
          return res.badRequest({
            message: 'Nothing was changed'
          });
        }

        let oldParams = _.pick(user, Object.keys(allParams));

        return User.update({id: user.id}, allParams)
          .then(([user]) => {
            req.user = user;

            // AddressHistory saving
            if (AddressHistory.constants.typesList.some(type => oldParams[type])) {
              let promises = [];

              AddressHistory.constants.typesList.forEach(type => {
                if (oldParams[type]) {
                  promises.push(AddressHistory.create({type, user: user.id, address: oldParams[type]}));
                }
              });

              Promise.all(promises).catch(err => sails.log.error(err));
            }

            return Object.assign({}, user, {documentUrl: `${prefix}/profile/document/${user.document}`});
          })
          .then(result => res.ok(result))
          .catch(err => res.negotiate(err));

      default:
        return res.send(405, {message: 'method not allowed'});
    }
  },

  verify: function (req, res) {
    if (req.user.verified) {
      return res.badRequest({ message: 'User has already verified id' });
    }

    let allParams = _.pick(req.allParams(), ['aptSte'].concat(needVerifyAttrs));

    let notFilledAttr = needVerifyAttrs.find(key => !allParams[key]);

    if (notFilledAttr) {
      return res.badRequest({
        message: `Field ${needVerifyNames[notFilledAttr]} must be filled`
      });
    }

    req.file('document').upload({
      adapter: skipperS3,
      key: sails.config.s3ApiKey,
      secret: sails.config.s3ApiSecret,
      bucket: sails.config.s3Bucket,
      region: sails.config.s3Region
    }, function (err, uploads) {
      if (err) {
        return res.negotiate(err);
      }

      if (uploads.length === 0) {
        return res.badRequest({message: 'No document image was uploaded'});
      }

      Files.create(uploads[0])
        .exec((err, file) => {
          if (err) {
            return res.negotiate(err);
          }

          allParams.document = file.id;
          allParams.needVerify = true; // Need admin verification

          // TODO: Add old document remove after update

          return User.update({id: req.user.id}, allParams)
            .then(([user]) => {
              req.user = user;
              return Object.assign({}, user, {documentUrl: `${prefix}/profile/document/${user.document}`});
            })
            .then(result => res.ok(result))
            .catch(err => res.negotiate(err));
        });
    });
  },

  document: function (req, res) {
    var fileID = req.param('id');

    if (fileID !== req.user.document) {
      return res.notFound();
    }

    Files.findOne({ id: fileID })
      .exec((err, file) => {
        if (err) {
          return res.serverError(err);
        }

        if (!file) {
          return res.notFound();
        }

        res.set('Content-Type', file.type);

        skipperS3Adapter.read(file.fd)
          .on('error', function (err) {
            return res.serverError(err);
          })
          .pipe(res);

        // const url = skipperS3Adapter.url('getObject', { s3params: { Key: file.fd } });

        // return res.redirect(303, url);
      });
  },

  selects: function (req, res) {
    return res.ok({
      identificationType: User.constants.identificationTypesSelect,
      country: CountriesService.list
    });
  },

  confirmEmail: function (req, res) {
    const token = req.param('token');

    User.findOne({emailVerificationToken: token})
      .then(user => {
        if (!user) {
          return Promise.reject(ErrorService.new({message: 'No user with such token found', status: 404}));
        }

        return User.update({id: user.id}, {emailVerified: true});
      })
      .then(result => res.redirect('/?emailVerified'))
      .catch(err => {
        sails.log.error(err);
        return res.redirect('/?emailUnverified');
      });
  },

  // POST /api/profile/forgotPassword
  forgotPassword: function (req, res) {
    const email = req.param('email');

    User.findOne({email})
      .then(user => {
        if (!user) {
          return Promise.reject(ErrorService.new({message: 'No user with such email found', status: 404}));
        }

        return User.update({id: user.id}, {resetPasswordToken: MiscService.generateRandomString(50)});
      })
      .then(updatedUsers => {
        MailerService.sendResetPwEmail(updatedUsers[0]);
      })
      .then(() => {
        res.ok({ message: 'Forgot password request has been successfully sent' });
      })
      .catch(err => res.negotiate(err));
  },

  // PUT /api/profile/restorePassword
  restorePassword: function (req, res) {
    const resetPasswordToken = req.param('token');
    const password = req.param('new_password');

    // if (!password) res.badRequest({ message: 'No password provided' });

    User.findOne({resetPasswordToken})
      .then(user => {
        if (!user) {
          return Promise.reject(ErrorService.new({message: 'No user with such token found', status: 404}));
        }

        return User.update({id: user.id}, { password, resetPasswordToken: '' });
      })
      .then(result => {
        res.ok({ message: 'Password has been successfully restored' });
      })
      .catch(err => res.negotiate(err));
  }
};
