/**
 * deny
 *
 * @description :: Policy for deny access actions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {
  return res.notFound();
};
