/**
 * Invites.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global MiscService MailerService */

module.exports = {
  attributes: {
    token: { type: 'string' },

    email: { type: 'string', required: true, email: true },

    toJSON: function () {
      var obj = this.toObject();

      delete obj.token;

      return obj;
    }
  },

  validationMessages: {
    email: {
      required: 'Email is required',
      email: 'Provide valid email',
      unique: 'Email is already invited'
    }
  },

  beforeValidate: function (values, cb) {
    if (values.email) {
      values.email = values.email.toLowerCase();
    }

    return cb();
  },

  beforeCreate: function (values, cb) {
    values.token = MiscService.generateRandomString(50);

    return cb();
  },

  afterCreate: function (values, cb) {
    MailerService.sendInviteUSEmail(values);

    return cb();
  }
};
