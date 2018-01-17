/**
 * SaleController
 *
 * @description :: Server-side logic for managing Sales
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Sale */

module.exports = {
  findLast: function (req, res) {
    Sale.findLast()
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
