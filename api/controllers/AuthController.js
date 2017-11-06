/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

const speakeasy = require('speakeasy');

module.exports = {

  /**
   * `AuthController.login()`
   */
  login: function (req, res) {
    const {userName, password, token} = req.allParams();

    User.findOne({userName: userName.toLowerCase(), enabled: true})
      .exec((err, user) => {
        if (err) {
          return res.negotiate;
        }

        if (!user) {
          return res.badRequest({
            message: 'Username or Password is invalid'
          });
        }

        User.comparePassword(password, user, (err, valid) => {
          if (err) {
            return res.negotiate(err);
          }

          if (!valid) {
            return res.badRequest({
              message: 'Username or Password is invalid'
            });
          }

          const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
          });

          if (!verified) {
            return res.badRequest({
              message: 'Google Authenticator Code is expired or invalid'
            });
          }

          req.session.userId = user.id;
          req.user = user;

          return res.ok(user);
        });
      });
  },

  /**
   * `AuthController.logout()`
   */
  logout: function (req, res) {
    return res.json({
      todo: 'logout() is not implemented yet!'
    });
  }
};
