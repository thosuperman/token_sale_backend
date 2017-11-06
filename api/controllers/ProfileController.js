/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
   * `ProfileController.index()`
   */
  index: function (req, res) {
    return res.json(req.user);
  }
};
