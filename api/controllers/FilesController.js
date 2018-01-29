/**
 * FilesController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails Files User */

const skipperS3 = require('skipper-better-s3')({
  key: sails.config.s3ApiKey,
  secret: sails.config.s3ApiSecret,
  bucket: sails.config.s3Bucket,
  region: sails.config.s3Region
});

module.exports = {
  _config: {
    actions: true
  },

  /**
   * `FilesController.findOne()`
   */
  findOne: function (req, res) {
    const fileID = req.param('id');
    const user = req.user;

    // NOTE: Policy inside FilesController
    if (!(user.role === User.constants.roles.admin || user.document === fileID)) {
      return res.notFound();
    }

    Files.findOne({ id: fileID })
      .exec((err, file) => {
        if (err) {
          return res.serverError(err);
        }

        if (!file) {
          return res.notFound();
        }

        res.set('Content-Type', file.type);

        skipperS3.read(file.fd)
          .on('error', function (err) {
            return res.serverError(err);
          })
          .pipe(res);

        // const url = skipperS3.url('getObject', { s3params: { Key: file.fd } });

        // return res.redirect(303, url);
      });
  }
};
