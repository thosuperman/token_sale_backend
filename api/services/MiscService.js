/**
 * MiscService
 * @description :: Set of misc functions
 */
const secureRandomString = require('secure-random-string');

module.exports = {
  cbify: function (promise, cb) {
    if (cb && typeof cb === 'function') {
      promise.then(cb.bind(null, null), cb);
    }

    return promise;
  },

  generateRandomString: function (length = 10) {
    return secureRandomString({length});
  },

  mapArrayToConstantsObject: arr => arr.reduce((obj, key) => {
    obj[key] = key;
    return obj;
  }, {})
};
