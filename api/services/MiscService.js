/**
 * MiscService
 * @description :: Set of misc functions
 */
const secureRandomString = require('secure-random-string');
const networkInterfaces = require('os').networkInterfaces;

module.exports = {
  cbify: function (promise, cb) {
    if (cb && typeof cb === 'function') {
      promise.then(cb.bind(null, null), cb);
    }

    return promise;
  },

  generateRandomString: function (length = 10, alphanumeric = false) {
    return secureRandomString({length, alphanumeric});
  },

  mapArrayToConstantsObject: arr => arr.reduce((obj, key) => {
    obj[key] = key;
    return obj;
  }, {}),

  getLocalExternalIp: () => [].concat.apply([], Object.values(networkInterfaces()))
    .filter(details => details.family === 'IPv4' && !details.internal)
    .pop().address
};
