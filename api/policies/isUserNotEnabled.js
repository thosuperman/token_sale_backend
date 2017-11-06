/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {
  // req.user creates in fetchUserHook
  if (!req.user) {
    return res.json(401, {message: 'User not start the registration'});
  }

  if (req.user.enabled) {
    return res.json(401, {message: 'User is already registered'});
  }

  return next();
};
