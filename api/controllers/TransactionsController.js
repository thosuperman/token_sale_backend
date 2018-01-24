/**
 * TransactionsController
 *
 * @description :: Server-side logic for managing transactions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Transactions User */

module.exports = {
  find: function (req, res) {
    const userId = req.user.id;
    const {
      limit = 10,
      page = 1,
      sort = 'date DESC'
    } = req.allParams();

    let where = { from: userId };

    Promise.all([
      Transactions.find({ where, sort }).paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  allocate: function (req, res) {
    let {id, KNT} = req.allParams();

    User.findOne({id})
     .exec((err, user) => {
       if (err) {
         return res.negotiate(err);
       }

       if (!user) {
         return res.notFound({message: 'User not found'});
       }

       return Transactions.create({
         type: Transactions.constants.types.allocateKNT,
         status: Transactions.constants.statuses.confirmed,
         date: new Date(),
         from: id,
         KNT,
         admin: req.user.id
       })
       .then(result => res.json(result))
       .catch(err => res.negotiate(err));
     });
  },

  findAllocate: function (req, res) {
    const userId = req.param('id');

    const {
      limit = 10,
      page = 1,
      sort = 'date DESC'
    } = req.allParams();

    let where = { from: userId };

    Promise.all([
      Transactions.find({ where, sort }).paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  }
};
