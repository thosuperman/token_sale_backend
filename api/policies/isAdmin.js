/**
 * isAdmin
 *
 * @description :: Policy to check if user is admin
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

/* global User */

module.exports = function (req, res, next) {
  // req.user creates in fetchUserHook
  if (!(req.user && req.user.role === User.constants.roles.admin)) {
    // return res.json(401, {message: 'User is not admin'});
    return res.notFound();
  }

  return next();
};
