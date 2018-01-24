/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails User MiscService AuthenticatorService MailerService */

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

  confirm: function (req, res) {
    const token = req.param('token');
    const password = req.param('password');
    const code = req.param('code');

    if (!token) {
      return res.badRequest({ message: 'Token can not be empty' });
    }

    if (!password) {
      return res.badRequest({ message: 'Password can not be empty' });
    }

    if (!code) {
      return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
    }

    User.findOne({emailVerificationToken: token})
      .exec((err, user) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!user) {
          return res.notFound({message: 'No user with such token found'});
        }

        if (!AuthenticatorService.verify(user.twoFactorSecret, code)) {
          return res.badRequest({
            message: 'Google Authenticator Code is expired or invalid'
          });
        }

        return User.update({id: user.id}, {password, emailVerified: true})
          .then(result => res.redirect('/admin/#/?emailVerified'))
          .catch(err => {
            sails.log.error(err);
            return res.redirect('/admin/#/?emailUnverified');
          });
      });
  }
};
