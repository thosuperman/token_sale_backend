/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {
  // req.user creates in fetchUserHook
  if (!req.user) {
    return res.json(401, {message: 'User is not authorized'});
  }

  return next();
};
