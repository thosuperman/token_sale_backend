/**
 * AuthenticatorRecovery.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global User ErrorService Files */

const {blueprints} = require('../../config/blueprints');
const prefix = blueprints.prefix || '';

module.exports = {
  attributes: {
    email: { type: 'string', required: true, email: true },

    user: { model: 'user' },

    photo: { model: 'files' },

    accepted: { type: 'boolean', defaultsTo: false },

    toJSON: function () {
      var obj = this.toObject();

      if (obj.photo) {
        obj.photoUrl = `${prefix}/files/` + (obj.photo.id || obj.photo);
        delete obj.photo;
      }

      return obj;
    }
  },

  validationMessages: {
    email: {
      required: 'Email is required',
      email: 'Provide valid email'
    }
  },

  beforeCreate: function (values, cb) {
    delete values.id;
    delete values.createdAt;
    delete values.updatedAt;

    if (values.email) {
      return User.findOne({email: values.email})
        .then(user => {
          if (!user) {
            return cb(ErrorService.new({
              status: 404,
              message: 'No user with such email registered in Kora ICO'
            }));
          }

          values.user = user.id;

          return cb();
        })
        .catch(err => cb(err));
    }

    return cb();
  },

  afterDestroy: function (records, cb) {
    Promise.all(records.map(r => Files.destroy({id: r.photo})))
      .then(() => cb())
      .catch(err => cb(err));
  }
};
