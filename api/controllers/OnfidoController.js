/**
 * OnfidoController
 *
 * @description :: Server-side logic for managing onfidoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global OnfidoService */

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
      // TODO: Add some status to user
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `OnfidoController.webhook()`
   */
  webhook: function (req, res) {
    return res.json({
      todo: 'webhook() is not implemented yet!'
    });
  }
};
