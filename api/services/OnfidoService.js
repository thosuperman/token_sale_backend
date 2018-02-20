/**
 * OnfidoService
 * @description :: onfido.com API
 */

/* global sails MiscService */

// const request = require('request');
const rp = require('request-promise-native').defaults({
  baseUrl: 'https://api.onfido.com/v2/',
  headers: {'Authorization': `Token token=${sails.config.onfidoApiToken}`},
  simple: true,
  json: true
});

module.exports = {
  applicants: function ({id}, cb) {
    let promise = rp({
      uri: `/applicants/${id || ''}`
    });

    return MiscService.cbify(promise, cb);
  },

  createApplicant: function ({body}, cb) {
    let promise = rp({
      method: 'POST',
      uri: '/applicants',
      body
    });

    return MiscService.cbify(promise, cb);
  },

  createCheck: function ({applicantId}, cb) {
    let promise = rp({
      method: 'POST',
      uri: `/applicants/${applicantId}/checks`,
      body: {
        type: 'standard',
        reports: [{
          name: 'identity'
        }]
      }
    });

    return MiscService.cbify(promise, cb);
  }
};
