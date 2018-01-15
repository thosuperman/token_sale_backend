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
      sort = 'email ASC'
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
  },

  findOne: function (req, res) {
    let id = req.param('id');

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        return res.ok(record);
      })
      .catch(err => res.negotiate(err));
  },

  verify: function (req, res) {
    let id = req.param('id');

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        if (record.verified) {
          return res.badRequest({
            message: 'User already verified'
          });
        }

        if (!record.needVerify) {
          return res.badRequest({
            message: 'User didn\'t fill verify data'
          });
        }

        return User.update({id: record.id}, {needVerify: false, verified: true});
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  },

  blockChange: function (req, res) {
    let id = req.param('id');

    User.findOne({id})
      .then(record => {
        if (!record) {
          return res.notFound();
        }

        return User.update({id: record.id}, {enabled: !record.enabled});
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
