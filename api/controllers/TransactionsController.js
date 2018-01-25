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

    let where = { user: userId };

    Promise.all([
      Transactions.find({ where, sort }).paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  findAll: function (req, res) {
    const {
      type,
      status,
      user,
      isUser, // boolean
      limit = 10,
      page = 1,
      sort = 'date DESC'
    } = req.allParams();

    let where = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (user) {
      where.user = user;
    }

    if (isUser != null) {
      where.user = isUser ? {'!': null} : null;
    }

    Promise.all([
      Transactions.find({ where, sort })
        .populate('user')
        .populate('admin')
        .populate('exchangeRate')
        .paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  },

  allocate: function (req, res) {
    let {id, KNT} = req.allParams();

    KNT = parseFloat(KNT);

    if (isNaN(KNT) && KNT <= 0) {
      return res.badRequest({message: 'KNT value is invalid'});
    }

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
         user: id,
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

    let where = {
      user: userId,
      type: Transactions.constants.types.allocateKNT
    };

    Promise.all([
      Transactions.find({ where, sort }).populate('admin').paginate({page, limit}),
      Transactions.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  }
};
