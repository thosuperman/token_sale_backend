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
    const sort = 'date DESC';
    const {
      type,
      limit = 10,
      skip = 0
    } = req.allParams();

    let where = { from: userId };

    if (type) {
      where.type = type;
    }

    Promise.all([
      Transactions.find({ where, limit, skip, sort }),
      Transactions.count(where)
    ])
    .then(([data, total]) => ({data, total}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  balance: function (req, res) {
    Transactions.find({ where: {from: req.user.id}, sort: 'date DESC' })
      .then(records => {
        if (!records) {
          return 0;
        }

        return records.reduce((sum, tx) => {
          sum += tx.KTN;
          return sum;
        }, 0);
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  filters: function (req, res) {
    return res.json({
      type: Transactions.constants.typesList
    });
  }
};
