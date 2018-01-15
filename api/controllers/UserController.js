/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global User */

module.exports = {
  find: function (req, res) {
    const {
      role,
      limit = 10,
      page = 1,
      sort = 'userName ASC'
    } = req.allParams();

    let where = {};

    if (role) {
      where.role = role;
    }

    Promise.all([
      User.find({ where, sort }).paginate({page, limit}),
      User.count(where)
    ])
    .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
    .then(result => res.json(result))
    .catch(err => res.negotiate(err));
  }
};
