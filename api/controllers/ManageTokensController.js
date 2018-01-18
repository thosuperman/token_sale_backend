/**
 * ManageTokensController
 *
 * @description :: Server-side logic for managing Managetokens
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Sale */

module.exports = {

  /**
   * `ManageTokensController.index()`
   */
  index: function (req, res) {
    Promise.all([
      Sale.findLast()
    ])
      .then(([sale]) => ({sale}))
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
