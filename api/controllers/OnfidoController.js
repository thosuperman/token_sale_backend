/**
 * OnfidoController
 *
 * @description :: Server-side logic for managing onfidoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global OnfidoService User */

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
      .then(check => User.update({id: req.user.id}, {check}).then(() => check))
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
  }
};
