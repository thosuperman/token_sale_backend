/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global _ User MiscService AuthenticatorService MailerService */

module.exports = {

  create: function (req, res) {
    const email = req.param('email');

    if (!email) {
      return res.badRequest({ message: 'Email can not be empty' });
    }

    const secret = AuthenticatorService.generateSecret();

    const cache = {};

    User.create({
      role: User.constants.roles.admin,
      email,
      password: MiscService.generateRandomString(42, true),
      twoFactorSecret: secret.base32
    })
    .then(user => {
      cache.user = user;

      return AuthenticatorService.generageQRCode(secret.otpauth_url);
    })
    .then(url => {
      MailerService.sendCreateAdminEmail(cache.user, { qrcode: url, key: secret.base32 });

      return cache.user;
    })
    .then(result => res.ok(result))
    .catch(err => res.negotiate(err));
  },

  update: function (req, res) {
    let allParams = _.pick(req.allParams(), ['firstName', 'lastName', 'email', 'phone']);

    return User.update({id: req.user.id}, allParams)
      .then(([user]) => {
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
