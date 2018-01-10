/**
 * FilesController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Files */

const fs = require('fs');

module.exports = {

  /**
   * `FilesController.findOne()`
   */
  findOne: function (req, res) {
    var fileID = req.param('id');

    Files.findOne({ id: fileID })
      .exec((err, file) => {
        if (err) {
          return res.serverError(err);
        }

        if (!file) {
          return res.notFound();
        }

        res.set('Content-Type', file.type);

        fs.createReadStream(file.fd)
          .on('error', function (err) {
            return res.serverError(err);
          })
          .pipe(res);
      });
  },

  /**
   * `FilesController.download()`
   */
  download: function (req, res) {
    var fileID = req.param('id');

    Files.findOne({ id: fileID })
      .exec((err, file) => {
        if (err) {
          return res.serverError(err);
        }

        if (!file) {
          return res.notFound();
        }

        res.download(file.fd, function (err) {
          if (err) {
            return res.serverError(err);
          }

          return res.ok();
        });
      });
  }
};
