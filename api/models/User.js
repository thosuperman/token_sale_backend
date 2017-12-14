/**
 * User.js
 *
 * @description :: Kora ICO user model.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ ValidationService CountriesService */

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
    phone: { type: 'string', unique: true, phoneNumber: true },

    // TODO: Add connection throught userName
    userName: { type: 'string', unique: true, alphanumericdashed: true },

    userNameOrigin: { type: 'string' },

    email: { type: 'string', unique: true, required: true, email: true },

    firstName: { type: 'string', required: true, alpha: true },

    lastName: { type: 'string', required: true, alpha: true },

    country: { type: 'string', required: true, in: CountriesService.list.map(el => el.countryCode) },

    nationality: { type: 'string', required: true, in: CountriesService.list.map(el => el.countryCode) },

    sendingEthereumAddress: { type: 'string', unique: true, required: true, ethereumAddress: true },

    receivingEthereumAddress: { type: 'string', unique: true, ethereumAddress: true },

    role: { type: 'string', in: rolesList, defaultsTo: roles.user },

    encryptedPassword: { type: 'string', required: true },

    twoFactorSecret: { type: 'string', required: true },

    registeredFromUSIP: { type: 'boolean', required: true },

    enabled: {type: 'boolean', defaultsTo: true},

    toJSON: function () {
      var obj = this.toObject();

      obj.userName = obj.userNameOrigin;
      delete obj.userNameOrigin;
      delete obj.encryptedPassword;
      delete obj.twoFactorSecret;

      if (obj.country) {
        obj.countryFlag = CountriesService.flagImg(obj.country);
        obj.countryName = CountriesService.collection[obj.country].name;
      }

      if (obj.nationality) {
        obj.nationalityFlag = CountriesService.flagImg(obj.nationality);
        obj.nationalityName = CountriesService.collection[obj.nationality].name;
      }

      return obj;
    }
  },

  types: {
    phoneNumber: value => ValidationService.phoneNumber(value),
    ethereumAddress: value => ValidationService.address(value)
  },

  validationMessages: {
    phone: {
      phoneNumber: 'Provide valid phone number',
      unique: 'Phone number is already taken'
    },
    userName: {
      // required: 'Username is required',
      alphanumericdashed: 'Provide valid username',
      unique: 'Username is already taken'
    },
    email: {
      required: 'Email is required',
      email: 'Provide valid email',
      unique: 'Email is already taken'
    },
    firstName: {
      required: 'First name is required',
      alpha: 'Provide valid first name'
    },
    lastName: {
      required: 'Last name is required',
      alpha: 'Provide valid last name'
    },
    country: {
      required: 'Country is required',
      in: 'Provide valid country'
    },
    nationality: {
      required: 'Nationality is required',
      in: 'Provide valid nationality'
    },
    sendingEthereumAddress: {
      required: 'Sending ethereum address is required',
      ethereumAddress: 'Provide valid sending ethereum address',
      unique: 'Sending ethereum address is already taken'
    },
    receivingEthereumAddress: {
      ethereumAddress: 'Provide valid receiving ethereum address',
      unique: 'Receiving ethereum address is already taken'
    },
    encryptedPassword: {
      required: 'Password is required'
    },
    twoFactorSecret: {
      required: 'Two factor secret is required'
    }
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
      options: {
        unique: true,
        partialFilterExpression: {userName: {$exists: true}}
      }
    }, {
      attributes: { email: 1 },
      options: { unique: true }
    }, {
      attributes: { sendingEthereumAddress: 1 },
      options: { unique: true }
    }, {
      attributes: { receivingEthereumAddress: 1 },
      options: {
        unique: true,
        partialFilterExpression: {receivingEthereumAddress: {$exists: true}}
      }
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

    if (values.sendingEthereumAddress) {
      values.sendingEthereumAddress = values.sendingEthereumAddress.toLowerCase();
    }

    if (values.receivingEthereumAddress) {
      values.receivingEthereumAddress = values.receivingEthereumAddress.toLowerCase();
    }

    if (values.password) {
      if (!ValidationService.password(values.password)) {
        return cb(new WLError({
          status: 400,
          message: 'Password must be over 8 characters, have at least 1 uppercase English letter, 1 lowercase English letter and 1 number'
        }));
      }

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
      return cb(new WLError({status: 400, message: 'Password must be set'}));
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
