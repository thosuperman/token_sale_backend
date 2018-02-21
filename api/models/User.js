/**
 * User.js
 *
 * @description :: Kora ICO user model.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ ValidationService CountriesService ErrorService MiscService MailerService Files OnfidoService */

const bcrypt = require('bcrypt');

const {blueprints} = require('../../config/blueprints');
const prefix = blueprints.prefix || '';

const roles = {
  admin: 'admin',
  user: 'user'
};
const rolesList = _.values(roles);

const identificationTypesNames = {
  driver: 'Driver\'s License',
  nonDriver: 'Non-driver Government ID',
  passport: 'Passport',
  other: 'Other'
};
const identificationTypesList = Object.keys(identificationTypesNames);
const identificationTypes = MiscService.mapArrayToConstantsObject(identificationTypesList);

const userRequiredAttrsNames = {
  'firstName': 'First Name',
  'lastName': 'Last Name',
  'country': 'Country',
  'nationality': 'Nationality'
};
const userRequiredAttrs = Object.keys(userRequiredAttrsNames);

module.exports = {
  constants: {
    roles,
    rolesList,
    identificationTypes,
    identificationTypesList,
    identificationTypesNames,
    identificationTypesSelect: _.map(identificationTypesNames, (value, key) => ({id: key, name: value}))
  },

  attributes: {
    userName: { type: 'string', unique: true, alphanumericdashed: true },

    userNameOrigin: { type: 'string' },

    email: { type: 'string', unique: true, required: true, email: true },

    firstName: { type: 'string', alpha: true },

    lastName: { type: 'string', alpha: true },

    phone: { type: 'string', unique: true, phoneNumber: true },

    country: { type: 'string', in: CountriesService.codesList },

    nationality: { type: 'string', in: CountriesService.codesList },

    dateOfBirth: { type: 'date', after: new Date('1900-01-01') },

    streetAddress: { type: 'string', maxLength: 64 },

    aptSte: { type: 'string', maxLength: 15 },

    city: { type: 'string', maxLength: 64 },

    state: { type: 'string', maxLength: 64 },

    zip: { type: 'string', postalCode: true },

    identificationType: { type: 'string', in: identificationTypesList },

    documentCountry: { type: 'string', in: CountriesService.codesList },

    document: { model: 'files' },

    needVerify: { type: 'boolean', defaultsTo: false },

    verified: { type: 'boolean', defaultsTo: false },

    emailVerificationToken: { type: 'string' },

    emailVerified: { type: 'boolean', defaultsTo: false },

    sendingEthereumAddress: { type: 'string', unique: true, ethereumAddress: true },

    receivingEthereumAddress: { type: 'string', unique: true, ethereumAddress: true },

    bitcoinAddress: { type: 'string', unique: true, bitcoinAddress: true },

    role: { type: 'string', in: rolesList, defaultsTo: roles.user },

    encryptedPassword: { type: 'string', required: true },

    resetPasswordToken: { type: 'string', defaultsTo: '' },

    twoFactorSecret: { type: 'string', required: true },

    registeredFromUSIP: { type: 'boolean' },

    isMVPUser: { type: 'boolean' },

    enabled: { type: 'boolean', defaultsTo: true },

    applicantId: { type: 'string' },

    toJSON: function () {
      var obj = this.toObject();

      obj.userName = obj.userNameOrigin;
      delete obj.userNameOrigin;
      delete obj.encryptedPassword;
      delete obj.resetPasswordToken;
      delete obj.twoFactorSecret;
      delete obj.emailVerificationToken;

      if (obj.country) {
        obj.countryFlag = CountriesService.flagImg(obj.country);
        obj.countryName = CountriesService.collection[obj.country].name;
      }

      if (obj.nationality) {
        obj.nationalityFlag = CountriesService.flagImg(obj.nationality);
        obj.nationalityName = CountriesService.collection[obj.nationality].name;
      }

      // TODO: Update documentUrl for admin
      if (obj.document) {
        obj.documentUrl = `${prefix}/files/` + (obj.document.id || obj.document);
        delete obj.document;
      }

      return obj;
    }
  },

  types: {
    phoneNumber: value => ValidationService.phoneNumber(value),
    ethereumAddress: value => ValidationService.ethereumAddress(value),
    bitcoinAddress: value => ValidationService.bitcoinAddress(value),
    postalCode: value => ValidationService.postalCode(value)
  },

  validationMessages: {
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
    phone: {
      phoneNumber: 'Provide valid phone number',
      unique: 'Phone number is already taken'
    },
    country: {
      required: 'Country is required',
      in: 'Provide valid country'
    },
    nationality: {
      required: 'Nationality is required',
      in: 'Provide valid nationality'
    },
    dateOfBirth: {
      date: 'Provide valid date of birth'
    },
    streetAddress: {
      string: 'Provide valid street address',
      maxLength: 'Street address too long'
    },
    aptSte: {
      string: 'Provide valid apt/ste',
      maxLength: 'Apt/ste too long'
    },
    city: {
      string: 'Provide valid city',
      maxLength: 'City too long'
    },
    state: {
      string: 'Provide valid state',
      maxLength: 'State too long'
    },
    zip: {
      postalCode: 'Provide valid zip'
    },
    identificationType: {
      in: 'Provide valid identification type'
    },
    documentCountry: {
      in: 'Provide valid document country'
    },
    sendingEthereumAddress: {
      // required: 'Sending ethereum address is required',
      ethereumAddress: 'Provide valid sending ethereum address',
      unique: 'Sending ethereum address is already taken'
    },
    receivingEthereumAddress: {
      ethereumAddress: 'Provide valid receiving ethereum address',
      unique: 'Receiving ethereum address is already taken'
    },
    bitcoinAddress: {
      bitcoinAddress: 'Provide valid bitcoin address',
      unique: 'Bitcoin address is already taken'
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
      options: {
        unique: true,
        partialFilterExpression: {sendingEthereumAddress: {$exists: true}}
      }
    }, {
      attributes: { receivingEthereumAddress: 1 },
      options: {
        unique: true,
        partialFilterExpression: {receivingEthereumAddress: {$exists: true}}
      }
    }, {
      attributes: { bitcoinAddress: 1 },
      options: {
        unique: true,
        partialFilterExpression: {bitcoinAddress: {$exists: true}}
      }
    }
  ],

  beforeValidate: function (values, cb) {
    if (values.role === roles.user) {
      let notFilledAttr = userRequiredAttrs.find(key => !values[key]);

      if (notFilledAttr) {
        return cb(ErrorService.new({
          status: 400,
          message: `${userRequiredAttrsNames[notFilledAttr]} is required`
        }));
      }
    }

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

    ['streetAddress', 'aptSte', 'city', 'state'].forEach(key => {
      if (values[key]) {
        values[key] = ValidationService.escape(values[key]);
      }
    });

    if (values.password) {
      if (!ValidationService.password(values.password)) {
        return cb(ErrorService.new({
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

  afterValidate: function (values, cb) {
    if (values.dateOfBirth) {
      let before = new Date();
      before.setFullYear(before.getFullYear() - 12);

      if (Date.parse(new Date(values.dateOfBirth)) > Date.parse(before)) {
        return cb(ErrorService.new({ status: 400, message: 'User must be 12 years old' }));
      }
    }

    return cb();
  },

  beforeCreate: function (values, cb) {
    if (!values.password) {
      return cb(ErrorService.new({status: 400, message: 'Password must be set'}));
    }

    if (values.role === roles.user && !(values.sendingEthereumAddress || values.bitcoinAddress)) {
      return cb(ErrorService.new({status: 400, message: 'Sending ethereum address or bitcoin address must be set'}));
    }

    values.emailVerificationToken = MiscService.generateRandomString(50);

    return cb();
  },

  afterCreate: function (record, cb) {
    if (record.role === roles.user) {
      return OnfidoService.createApplicant({user: record})
        .then(applicant => this.update({id: record.id}, {applicantId: applicant.id}))
        .then(([updatedRecord]) => {
          record = updatedRecord;
          return cb();
        })
        .catch(err => cb(err));
    }

    return cb();
  },

  beforeUpdate: function (valuesToUpdate, cb) {
    if (valuesToUpdate.email) {
      valuesToUpdate.emailVerified = false;
      valuesToUpdate.emailVerificationToken = MiscService.generateRandomString(50);
      MailerService.sendConfirmationEmail(valuesToUpdate);
    }

    return cb();
  },

  afterUpdate: function (record, cb) {
    if (record.role === roles.user && record.enabled && !record.verified) {
      if (!record.applicantId) {
        return OnfidoService.createApplicant({user: record})
          .then(applicant => this.update({id: record.id}, {applicantId: applicant.id}))
          .then(([updatedRecord]) => {
            record = updatedRecord;
            return cb();
          })
          .catch(err => cb(err));
      }

      return OnfidoService.updateApplicant({user: record})
        .then(() => cb())
        .catch(err => cb(err));
    }

    return cb();
  },

  afterDestroy: function (records, cb) {
    Promise.all(records.map(r => Files.destroy({id: r.photo})))
      .then(() => cb())
      .catch(err => cb(err));
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
