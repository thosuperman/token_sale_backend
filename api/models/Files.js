/**
 * Files.js
 *
 * @description :: Uploaded files model
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global sails */

const skipperS3 = require('skipper-better-s3')({
  key: sails.config.s3ApiKey,
  secret: sails.config.s3ApiSecret,
  bucket: sails.config.s3Bucket,
  region: sails.config.s3Region
});

module.exports = {
  constants: {
    maxBytes: 20 * 1024 * 1024
  },

  attributes: {
    fd: { type: 'string', required: true },

    size: { type: 'integer', required: true },

    type: { type: 'string', required: true },

    filename: { type: 'string', required: true },

    extra: { type: 'json' }
  },

  afterDestroy: function (records, cb) {
    Promise.all(records.map(r => removeFromS3(r.fd)))
      .then(() => cb())
      .catch(err => cb(err));
  }
};

function removeFromS3 (fd) {
  return new Promise((resolve, reject) => {
    skipperS3.rm(fd, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}
