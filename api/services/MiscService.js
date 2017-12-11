/**
 * MiscService
 * @description :: Set of misc functions
 */

module.exports = {
  cbify: function (promise, cb) {
    if (cb && typeof cb === 'function') {
      promise.then(cb.bind(null, null), cb);
    }

    return promise;
  }
};
