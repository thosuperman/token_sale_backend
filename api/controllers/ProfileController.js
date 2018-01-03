/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User AuthenticatorService */

module.exports = {

  _config: {
    actions: true
  },

  /**
   * `ProfileController.index()`
   */
  index: function (req, res) {
    switch (req.method) {
      case 'GET':
        return res.json(req.user);

      case 'PUT':
        let allParams = req.allParams();

        if (!allParams.token) {
          return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
        }

        if (!AuthenticatorService.verify(req.user.twoFactorSecret, allParams.token)) {
          return res.badRequest({
            message: 'Google Authenticator Code is expired or invalid'
          });
        }

        delete allParams.role;
        delete allParams.password;
        delete allParams.encryptedPassword;
        delete allParams.twoFactorSecret;
        delete allParams.enabled;
        delete allParams.userNameOrigin;
        delete allParams.registeredFromUSIP;
        delete allParams.sendingEthereumAddress;
        delete allParams.receivingEthereumAddress;

        return User.update({id: req.user.id}, allParams)
          .then(([user]) => {
            req.user = user;
            return user;
          })
          .then(result => res.ok(result))
          .catch(err => res.negotiate(err));

      default:
        return res.send(405, {message: 'Method not allowed'});
    }
  }
};
