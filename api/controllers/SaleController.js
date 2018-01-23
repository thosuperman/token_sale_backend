/**
 * SaleController
 *
 * @description :: Server-side logic for managing Sales
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global _ Sale User */

module.exports = {
  findLast: function (req, res) {
    Sale.findLast()
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  create: function (req, res) {
    let allParams = _.pick(req.allParams(), ['USD_KNT', 'preSale', 'publicSale']);

    allParams.user = req.user.id;

    Sale.create(allParams)
      .then(record => Sale.calcDisabled(record))
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  switchToPublicSale: function (req, res) {
    let password = req.param('password');

    if (!password) {
      return res.badRequest({message: 'Admin password must be set'});
    }

    Sale.findLast((err, lastSale) => {
      if (err) {
        return res.negotiate(err);
      }

      if (lastSale.isPublicSale) {
        return res.badRequest({message: 'Public sale already launched'});
      }

      User.comparePassword(password, req.user, (err, match) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!match) {
          return res.badRequest({message: 'Wrong password'});
        }

        return Sale.create({
          isPublicSale: true,
          user: req.user.id
        })
          .then(record => Sale.calcDisabled(record))
          .then(result => res.json(result))
          .catch(err => res.negotiate(err));
      });
    });
  }
};
