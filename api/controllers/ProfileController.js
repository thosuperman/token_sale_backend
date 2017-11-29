/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

const speakeasy = require('speakeasy');

module.exports = {

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

        // TODO: Move Google Authenticator logic to service
        const verified = speakeasy.totp.verify({
          secret: req.user.twoFactorSecret,
          encoding: 'base32',
          token: allParams.token
        });

        if (!verified) {
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
