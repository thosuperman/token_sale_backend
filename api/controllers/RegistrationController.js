/**
 * RegistrationController
 *
 * @description :: Server-side logic for managing registrations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

module.exports = {

  /**
   * `RegistrationController.userInfo()`
   */
  userInfo: function (req, res) {
    let allParams = req.allParams();

    // if (allParams.password !== allParams.confirmPassword) {
    //   return res.badRequest({message: 'Password doesn\'t match, What a shame!'})
    // }
    //
    // delete allParams.confirmPassword

    User.create(allParams)
      .then(user => {
        req.session.userId = user.id;
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  /**
   * `RegistrationController.ethereumAddress()`
   */
  ethereumAddress: function (req, res) {
    return res.json({
      todo: 'ethereumAddress() is not implemented yet!'
    });
  },

  /**
   * `RegistrationController.Confirm()`
   */
  Confirm: function (req, res) {
    return res.json({
      todo: 'Confirm() is not implemented yet!'
    });
  }
};
