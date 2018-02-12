/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User ValidationService AuthenticatorService Sessions */

module.exports = {

  /**
   * `AuthController.login()`
   */
  login: function (req, res) {
    let {userName, password, token} = req.allParams();

    if (!userName) {
      return res.badRequest({ message: 'Username/email can not be empty' });
    }

    if (!password) {
      return res.badRequest({ message: 'Password can not be empty ' });
    }

    if (!token) {
      return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
    }

    userName = ValidationService.escape(userName);

    User.findOne({
      or: [
        {phone: userName},
        {userName: userName.toLowerCase()},
        {email: userName.toLowerCase()}
      ]
    })
      .exec((err, user) => {
        if (err) {
          return res.negotiate;
        }

        if (!user) {
          return res.badRequest({
            message: 'Username or Password is invalid'
          });
        }

        if (!user.enabled) {
          return res.badRequest({
            message: 'User was blocked by admin'
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

          if (!AuthenticatorService.verify(user.twoFactorSecret, token)) {
            return res.badRequest({
              message: 'Google Authenticator Code is expired or invalid'
            });
          }

          req.session.userId = user.id;
          req.user = user;

          Sessions.destroy({session: {contains: user.id}, id: {not: req.sessionID}})
            .exec(err => {
              if (err) {
                return res.negotiate(err);
              }

              return res.ok(user);
            });
        });
      });
  },

  /**
   * `AuthController.logout()`
   */
  logout: function (req, res) {
    req.session.destroy();
    req.user = null;

    return res.ok({
      message: 'User is loged out'
    });
  }
};
