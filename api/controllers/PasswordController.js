/**
 * PasswordController
 *
 * @description :: Server-side logic for managing passwords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User AuthenticatorService */

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

    if (oldPassword) {
      return res.badRequest({message: 'Old password is required'});
    }

    if (newPassword) {
      return res.badRequest({message: 'New password is required'});
    }

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

      if (!AuthenticatorService.verify(user.twoFactorSecret, token)) {
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
