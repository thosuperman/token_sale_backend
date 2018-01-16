/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails _ User Files CountriesService */

const fs = require('fs');
const skipperS3 = require('skipper-s3');

const updateAttrs = ['email', 'sendingEthereumAddress', 'bitcoinAddress'];

const needVerifyAttrs = [
  'firstName',
  'lastName',
  'phone',
  'country',
  'dateOfBirth',
  'streetAddress',
  'city',
  'state',
  'zip',
  'identificationType',
  'documentCountry'
];

module.exports = {

  /**
   * `ProfileController.index()`
   */
  index: function (req, res) {
    switch (req.method) {
      case 'GET':
        return res.json(req.user);

      case 'PUT':
        const user = req.user;
        let allParams = _.pick(req.allParams(), updateAttrs);

        // if (!allParams.token) {
        //   return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
        // }

        // if (!AuthenticatorService.verify(req.user.twoFactorSecret, allParams.token)) {
        //   return res.badRequest({
        //     message: 'Google Authenticator Code is expired or invalid'
        //   });
        // }

        allParams = _.pick(allParams, (value, key) => (user[key] !== value));

        if (_.isEmpty(allParams)) {
          return res.badRequest({
            message: 'Nothing was changed'
          });
        }

        return User.update({id: user.id}, allParams)
          .then(([user]) => {
            req.user = user;
            return user;
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

    if (needVerifyAttrs.some(key => !allParams[key])) {
      return res.badRequest({
        message: 'All required Verify ID fields must be filled'
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

          return User.update({id: req.user.id}, allParams)
            .then(([user]) => {
              req.user = user;
              return user;
            })
            .then(result => res.ok(result))
            .catch(err => res.negotiate(err));
        });
    });
  },

  document: function (req, res) {
    var fileID = req.user.document;

    if (!fileID) {
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

        fs.createReadStream(file.fd)
          .on('error', function (err) {
            return res.serverError(err);
          })
          .pipe(res);
      });
  },

  selects: function (req, res) {
    return res.ok({
      identificationType: User.constants.identificationTypesSelect,
      country: CountriesService.list
    });
  }
};
