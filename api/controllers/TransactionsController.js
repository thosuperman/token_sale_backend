/**
 * TransactionsController
 *
 * @description :: Server-side logic for managing transactions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Transactions */

module.exports = {
  find: function (req, res) {
    const userId = req.user.id;
    const {
      type,
      limit = 10,
      page = 1,
      sort = 'date DESC'
    } = req.allParams();

    let where = { from: userId };

    if (type) {
      where.type = type;
    }

    Promise.all([
      Transactions.find({ where, sort }).paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  filters: function (req, res) {
    return res.json({
      type: Transactions.constants.typesList
    });
  }
};
