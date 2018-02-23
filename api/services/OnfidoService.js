/**
 * OnfidoService
 * @description :: onfido.com API
 */

/* global sails MiscService */

const baseUrl = 'https://api.onfido.com/';
const headers = {'Authorization': `Token token=${sails.config.onfidoApiToken}`};

const request = require('request').defaults({ headers });
const requestBase = request.defaults({ baseUrl });

const rp = require('request-promise-native').defaults({
  // baseUrl: 'https://api.onfido.com/v2/',
  headers,
  simple: false,
  resolveWithFullResponse: true,
  json: true
});

const rpBase = rp.defaults({ baseUrl });

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
  request,

  requestBase,

  applicants: function ({applicantId}, cb) {
    let promise = rpBase({
      uri: `/v2/applicants/${applicantId || ''}`
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  createApplicant: function ({user}, cb) {
    let promise = rpBase({
      method: 'POST',
      uri: '/v2/applicants',
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
    let promise = rpBase({
      method: 'PUT',
      uri: `/v2/applicants/${user.applicantId}`,
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
    let promise = rpBase({
      method: 'POST',
      uri: `/v2/applicants/${applicantId}/checks`,
      body: {
        type: 'express',
        reports: [
          { name: 'document' },
          { name: 'facial_similarity' }
        ]
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  sdkToken: function ({applicantId}, cb) {
    let promise = rpBase({
      method: 'POST',
      uri: `/v2/sdk_token`,
      body: {
        applicant_id: applicantId,
        referrer: sdkTokenReferrer
      }
    });

    return MiscService.cbify(handleResponse(promise), cb);
  },

  listDocuments: function ({applicantId}, cb) {
    let promise = rpBase({
      method: 'GET',
      uri: `/v2/applicants/${applicantId}/documents`
    });

    return MiscService.cbify(handleResponse(promise), cb);
  }
};
