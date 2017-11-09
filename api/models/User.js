/**
 * User.js
 *
 * @description :: Kora ICO user model.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ sails ValidationService */

const bcrypt = require('bcrypt');

const WLError = require('waterline/lib/waterline/error/WLError');

const roles = {
  admin: 'admin',
  user: 'user'
};
const rolesList = _.values(roles);

module.exports = {
  constants: {
    roles,
    rolesList
  },

  attributes: {
    phone: { type: 'string', phoneNumber: true },

    userName: { type: 'string', required: true, alphanumericdashed: true },

    userNameOrigin: { type: 'string' },

    email: { type: 'string', required: true, email: true },

    firstName: { type: 'string', required: true, alpha: true },

    lastName: { type: 'string', required: true, alpha: true },

    ethereumAddress: { type: 'string', required: true, ethereumAddress: true },

    role: { type: 'string', in: rolesList, defaultsTo: roles.user },

    encryptedPassword: { type: 'string', required: true },

    twoFactorSecret: { type: 'string', required: true },

    enabled: {type: 'boolean', defaultsTo: true},

    toJSON: function () {
      var obj = this.toObject();

      obj.userName = obj.userNameOrigin;
      delete obj.userNameOrigin;
      delete obj.encryptedPassword;
      delete obj.twoFactorSecret;

      return obj;
    }
  },

  types: {
    phoneNumber: value => ValidationService.phoneNumber(value),
    ethereumAddress: value => ValidationService.address(value)
  },

  indexes: [
    {
      attributes: { phone: 1 },
      options: {
        unique: true,
        partialFilterExpression: {phone: {$exists: true}}
      }
    }, {
      attributes: { userName: 1 },
      options: { unique: true }
    }, {
      attributes: { email: 1 },
      options: { unique: true }
    }
  ],

  beforeValidate: function (values, cb) {
    if (values.userName) {
      values.userNameOrigin = values.userName;
      values.userName = values.userName.toLowerCase();
    }

    if (values.email) {
      values.email = values.email.toLowerCase();
    }

    if (values.password) {
      return bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          return cb(err);
        }

        bcrypt.hash(values.password, salt, function (err, hash) {
          if (err) {
            return cb(err);
          }

          values.encryptedPassword = hash;

          return cb();
        });
      });
    }

    return cb();
  },

  beforeCreate: function (values, cb) {
    if (!values.password) {
      return cb(new WLError({status: 400, reason: 'Password must be set'}));
    }

    return cb();
  },

  comparePassword: function (password, user, cb) {
    bcrypt.compare(password, user.encryptedPassword, function (err, match) {
      if (err) {
        return cb(err);
      }

      return cb(null, match);
    });
  },

  findOneUnique: function (identifier, cb) {
    this.findOne({or: [
        {phone: identifier},
        {userName: identifier.toLowerCase()},
        {email: identifier.toLowerCase()}
    ]})
      .then(user => cb(null, user))
      .catch(err => cb(err));
  }
};
