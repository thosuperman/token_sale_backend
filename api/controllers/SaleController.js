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
  },

  create: function (req, res) {
    let allParams = req.allParams();

    allParams.user = req.user.id;

    Sale.create(allParams)
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
