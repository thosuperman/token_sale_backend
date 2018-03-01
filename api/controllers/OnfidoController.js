/**
 * OnfidoController
 *
 * @description :: Server-side logic for managing onfidoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global OnfidoService User Onfido _ */

const {blueprints} = require('../../config/blueprints');
const prefix = blueprints.prefix || '';

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
      .then(onfido => User.update({id: req.user.id}, {onfidoChecked: true}).then(() => ({
        documentUrl: `${prefix}/onfido/document/` + req.user.applicantId,
        check: onfido.check
      })))
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

        // res.set('Content-Type', 'text/html; charset=utf-8');

        // res.ok(_.unescape(record.escapedReport));

        OnfidoService.request({
          uri: record.check.download_uri
        })
          .on('error', function (err) {
            return res.negotiate(err);
          })
          .pipe(res);
      });
  }
};
