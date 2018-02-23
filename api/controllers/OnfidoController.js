/**
 * OnfidoController
 *
 * @description :: Server-side logic for managing onfidoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails OnfidoService User Onfido Files _ */

const skipperS3 = require('skipper-better-s3')({
  key: sails.config.s3ApiKey,
  secret: sails.config.s3ApiSecret,
  bucket: sails.config.s3Bucket,
  region: sails.config.s3Region
});

module.exports = {

  /**
   * `OnfidoController.sdkToken()`
   */
  sdkToken: function (req, res) {
    if (!req.user.applicantId) {
      return res.badRequest({message: 'Current user has no applicant id. Try to update user info.'});
    }

    OnfidoService.sdkToken({applicantId: req.user.applicantId})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `OnfidoController.createCheck()`
   */
  createCheck: function (req, res) {
    if (!req.user.applicantId) {
      return res.badRequest({message: 'Current user has no applicant id. Try to update user info.'});
    }

    OnfidoService.createCheck({applicantId: req.user.applicantId})
      .then(check => Onfido.findOne({user: req.user.id})
        .then(record => {
          if (!record) {
            return Onfido.create({user: req.user.id, applicantId: req.user.applicantId, check});
          }

          return Onfido.update({id: record.id}, {check}).then(([record]) => record);
        })
      )
      .then(onfido => User.update({id: req.user.id}, {onfidoChecked: true})
        .then(() => {
          OnfidoService.listDocuments({applicantId: req.user.applicantId}, (err, {documents}) => {
            if (err) {
              return sails.log.error(err);
            }

            if (!(documents && documents[0])) {
              return sails.log.error('Document not found');
            }

            let file = OnfidoService.requestBase({
              uri: documents[0].download_href
            });

            file.on('error', err => sails.log.error(err));

            const receiver = skipperS3.receive();

            receiver.write(file, (...args) => {
              sails.log.info('receiver.write args', args);

              Files.create(file)
                .then(file => {
                  let oldDocument = req.user.document;

                  return User.update({id: req.user.id}, {document: file.id})
                    .then(() => {
                      sails.log.info('Document upload to S3 finished');

                      if (oldDocument) {
                        return Files.destroy({id: oldDocument});
                      }
                    });
                })
                .catch(err => sails.log.error(err));
            }
            );
          });

          return onfido.check;
        })
      )
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  document: function (req, res) {
    const applicantId = req.param('id');
    const user = req.user;

    // NOTE: Policy inside OnfidoService.document
    if (!(user.role === User.constants.roles.admin || applicantId === user.applicantId)) {
      return res.notFound();
    }

    OnfidoService.listDocuments({applicantId}, (err, {documents}) => {
      if (err) {
        return res.negotiate(err);
      }

      if (!(documents && documents[0])) {
        return res.notFound();
      }

      OnfidoService.requestBase({
        uri: documents[0].download_href
      })
        .on('error', function (err) {
          return res.negotiate(err);
        })
        .pipe(res);
    });
  },

  report: function (req, res) {
    const applicantId = req.param('id');

    Onfido.findOne({applicantId})
      .exec((err, record) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!record) {
          return res.notFound();
        }

        res.set('Content-Type', 'text/html; charset=utf-8');

        res.ok(_.unescape(record.escapedReport));
      });
  }
};
