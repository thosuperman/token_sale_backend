/**
 * OnfidoService
 * @description :: onfido.com API
 */

/* global sails MiscService */

// const request = require('request');
const rp = require('request-promise-native').defaults({
  baseUrl: 'https://api.onfido.com/v2/',
  headers: {'Authorization': `Token token=${sails.config.onfidoApiToken}`},
  simple: false,
  resolveWithFullResponse: true,
  json: true
});

const sdkTokenReferrer = (sails.config.environment === 'production') ? 'https://token.kora.network/*' : '*://*/*';

const handleResponse = promise => promise
  .then(response => {
    let body = response.body || {};

    if (!(/^2/.test('' + response.statusCode))) {
      let err = new Error((body.error && body.error.message) || 'Something went wrong');
      err.status = response.statusCode || 500;
      err.error = body.error || body;

      return Promise.reject(err);
    }

    return body;
  });

module.exports = {
  applicants: function ({applicantId}, cb) {
    let promise = rp({
      uri: `/applicants/${applicantId || ''}`
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  createApplicant: function ({user}, cb) {
    let promise = rp({
      method: 'POST',
      uri: '/applicants',
      body: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        country: user.country,
        nationality: user.nationality
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  updateApplicant: function ({user}, cb) {
    let promise = rp({
      method: 'PUT',
      uri: `/applicants/${user.applicantId}`,
      body: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        country: user.country,
        nationality: user.nationality
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  createCheck: function ({applicantId}, cb) {
    let promise = rp({
      method: 'POST',
      uri: `/applicants/${applicantId}/checks`,
      body: {
        type: 'express',
        reports: [
          { name: 'document' }
          // { name: 'facial_similarity' }
        ]
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  sdkToken: function ({applicantId}, cb) {
    let promise = rp({
      method: 'POST',
      uri: `/sdk_token`,
      body: {
        applicant_id: applicantId,
        referrer: sdkTokenReferrer
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  }
};
