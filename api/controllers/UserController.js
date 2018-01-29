/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global _ User AuthenticatorService MiscService MailerService */

module.exports = {
  // TODO: Review blueprints global logic
  _config: {
    blueprints: false
  },

  find: function (req, res) {
    const {
      search = '',
      role,
      enabled,
      verified,
      needVerify,
      limit = 10,
      page = 1,
      sort = 'email ASC'
    } = req.allParams();

    let where = {};

    if (search) {
      where.or = [
        {phone: {contains: search}},
        {userName: {contains: search}},
        {email: {contains: search}},
        {firstName: {contains: search}},
        {lastName: {contains: search}},
        {sendingEthereumAddress: {contains: search}},
        {receivingEthereumAddress: {contains: search}},
        {bitcoinAddress: {contains: search}}
      ];
    }

    if (role) {
      where.role = role;
    }

    if (enabled) {
      where.enabled = enabled;
    }

    if (verified) {
      where.verified = verified;
    }

    if (needVerify) {
      where.needVerify = needVerify;
    }

    Promise.all([
      User.find({ where, sort }).paginate({page, limit}),
      User.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  findOne: function (req, res) {
    let id = req.param('id');

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        return res.ok(record);
      })
      .catch(err => res.negotiate(err));
  },

  verify: function (req, res) {
    let id = req.param('id');

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        if (record.verified) {
          return res.badRequest({
            message: 'User already verified'
          });
        }

        if (!record.needVerify) {
          return res.badRequest({
            message: 'User didn\'t fill verify data'
          });
        }

        if (!record.emailVerified) {
          return res.badRequest({
            message: 'User have not verified his email'
          });
        }

        return User.update({id: record.id}, {needVerify: false, verified: true});
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  blockChange: function (req, res) {
    let id = req.param('id');

    if (id === req.user.id) {
      return res.badRequest({ message: 'Admin can\'t block himself' });
    }

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        return User.update({id: record.id}, {enabled: !record.enabled});
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  update: function (req, res) {
    let id = req.param('id');
    let allParams = _.pick(req.allParams(), [
      'email',
      'sendingEthereumAddress',
      'bitcoinAddress',
      'firstName',
      'lastName',
      'phone'
    ]);

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        return User.update({id: record.id}, allParams);
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  create: function (req, res) {
    let allParams = _.pick(req.allParams(), [
      'email',
      'sendingEthereumAddress',
      'bitcoinAddress',
      'firstName',
      'lastName',
      'country',
      'nationality'
    ]);

    const secret = AuthenticatorService.generateSecret();

    const cache = {};

    User.create(Object.assign(allParams, {
      password: MiscService.generateRandomString(42, true),
      twoFactorSecret: secret.base32
    }))
    .then(user => {
      cache.user = user;

      return AuthenticatorService.generageQRCode(secret.otpauth_url);
    })
    .then(url => {
      MailerService.sendCreateUserEmail(cache.user, { qrcode: url, key: secret.base32 });

      return cache.user;
    })
    .then(result => res.ok(result))
    .catch(err => res.negotiate(err));
  }
};
