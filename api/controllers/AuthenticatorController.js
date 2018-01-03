/**
 * AuthenticatorController
 *
 * @description :: Server-side logic for managing authenticators
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User AuthenticatorService */

module.exports = {

  /**
   * `AuthenticatorController.regenerate()`
   */
  regenerate: function (req, res) {
    const {token} = req.allParams();

    if (!AuthenticatorService.verify(req.user.twoFactorSecret, token)) {
      return res.badRequest({
        message: 'Google Authenticator Code is expired or invalid'
      });
    }

    const secret = AuthenticatorService.generateSecret();

    req.session.newTwoFactorSecret = secret.base32;

    return AuthenticatorService.generageQRCode(secret.otpauth_url)
      .then(url => ({
        qrcode: url,
        key: secret.base32
      }))
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * AuthenticatorController.reEnable()
   */
  reEnable: function (req, res) {
    const {token} = req.allParams();
    let newTwoFactorSecret = req.session.newTwoFactorSecret;

    if (!newTwoFactorSecret) {
      return res.badRequest({
        message: 'Google Authenticator Secret Key was not regenerated'
      });
    }

    if (!AuthenticatorService.verify(newTwoFactorSecret, token)) {
      return res.badRequest({
        message: 'Google Authenticator Code is expired or invalid'
      });
    }

    User.update({id: req.user.id}, {twoFactorSecret: newTwoFactorSecret})
      .then(([user]) => {
        req.user = user;

        delete req.session.newTwoFactorSecret;

        return res.ok({
          message: 'Google Authenticator Secret Key was re-enabled',
          key: newTwoFactorSecret
        });
      })
      .catch(err => res.negotiate(err));
  }
};
