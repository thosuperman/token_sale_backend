/**
 * AuthenticatorRecoveryController
 *
 * @description :: Server-side logic for managing Authenticatorrecoveries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global AuthenticatorRecovery Files */

var path = require('path');

const maxBytes = 20 * 1024 * 1024;

module.exports = {
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
          maxBytes,
          dirname: path.resolve('uploads/recovery')
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
  }
};
