/**
 * AuthenticatorRecoveryController
 *
 * @description :: Server-side logic for managing Authenticatorrecoveries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails AuthenticatorRecovery Files AuthenticatorService User MailerService */

const skipperS3 = require('skipper-better-s3');

module.exports = {
  find: function (req, res) {
    const {
      limit = 10,
      page = 1,
      sort = 'updatedAt ASC'
    } = req.allParams();

    let where = { accepted: true };

    Promise.all([
      AuthenticatorRecovery.find({ where, sort }).populate('user').paginate({page, limit}),
      AuthenticatorRecovery.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  update: function (req, res) {
    let id = req.param('id');

    AuthenticatorRecovery.findOne({id})
      .exec((err, record) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!record) {
          return res.notFound({message: 'Google Authenticator secret code recovery request record not found'});
        }

        if (record.accepted) {
          return res.badRequest({message: 'Google Authenticator secret code recovery request already accepted'});
        }

        req.file('photo').upload({
          adapter: skipperS3,
          key: sails.config.s3ApiKey,
          secret: sails.config.s3ApiSecret,
          bucket: sails.config.s3Bucket,
          region: sails.config.s3Region
          // headers: {
          //   'x-amz-acl': 'YOUR_FILE_PERMISSIONS'
          // }
        }, function (err, uploads) {
          if (err) {
            return res.negotiate(err);
          }

          if (uploads.length === 0) {
            return res.badRequest({message: 'No file was uploaded'});
          }

          Files.create(uploads[0])
          .exec((err, file) => {
            if (err) {
              return res.negotiate(err);
            }

            AuthenticatorRecovery.update({id}, {
              photo: file.id,
              accepted: true
            })
            .then(([record]) => {
              return res.ok({
                message: 'Google Authenticator secret code recovery request accepted'
              });
            })
            .catch(err => res.negotiate(err));
          });
        });
      });
  },

  reset: function (req, res) {
    let id = req.param('id');

    AuthenticatorRecovery.findOne({id}).populate('user')
      .exec((err, record) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!record) {
          return res.notFound({message: 'Google Authenticator secret code recovery request record not found'});
        }

        if (!record.accepted) {
          return res.badRequest({message: 'Google Authenticator secret code recovery request not accepted'});
        }

        const secret = AuthenticatorService.generateSecret();

        req.session.newTwoFactorSecret = secret.base32;

        return User.update({id: record.user.id}, {twoFactorSecret: secret.base32})
          .then(user => AuthenticatorService.generageQRCode(secret.otpauth_url))
          .then(url => {
            MailerService.sendAuthenticatorRecoveryEmail(record.user, { qrcode: url, key: secret.base32 });

            return AuthenticatorRecovery.destroy({id});
          })
          .then(([record]) => {
            return res.ok({
              message: 'Email with new Google Authenticator secret seed was sent to user'
            });
          })
          .catch(err => res.negotiate(err));
      });
  }
};
