/**
 * Onfido.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ OnfidoService */

module.exports = {
  attributes: {
    user: { model: 'user', required: true },

    applicantId: { type: 'string', required: true },

    check: { type: 'json', required: true },

    escapedReport: { type: 'string' }
  },

  afterValidate: function (values, cb) {
    if (values.check && values.check.download_uri) {
      return OnfidoService.request({
        uri: values.check.download_uri
      }, (err, response, body) => {
        if (err) {
          return cb(err);
        }

        values.escapedReport = _.escape(body);

        return cb();
      });
    }

    return cb();
  }
};
