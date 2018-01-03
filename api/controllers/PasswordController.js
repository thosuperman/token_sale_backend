/**
 * PasswordController
 *
 * @description :: Server-side logic for managing passwords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

const speakeasy = require('speakeasy');

module.exports = {

  /**
   * `PasswordController.change()`
   */
  change: function (req, res) {
    const user = req.user;
    const {
      oldPassword,
      newPassword,
      newPasswordConfirm,
      token
    } = req.allParams();

    if (newPassword !== newPasswordConfirm) {
      return res.badRequest({message: 'New password and new password confirm doesn\'t match'});
    }

    User.comparePassword(oldPassword, user, (err, valid) => {
      if (err) {
        return res.negotiate(err);
      }

      if (!valid) {
        return res.badRequest({
          message: 'Old password is invalid'
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

      User.update({id: user.id}, {password: newPassword})
        .then(([user]) => {
          req.user = user;

          return res.ok({
            message: 'Password change was success'
          });
        })
        .catch(err => res.negotiate(err));
    });
  }
};
