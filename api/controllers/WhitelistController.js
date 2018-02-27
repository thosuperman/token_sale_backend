/**
 * WhitelistController
 *
 * @description :: Server-side logic for managing whitelists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Whitelist */

module.exports = {
  find: function (req, res) {
    const {
      search = '',
      limit = 10,
      page = 1,
      sort = 'updatedAt DESC'
    } = req.allParams();

    let where = {};

    if (search) {
      where.or = [
        {email: {contains: search}},
        {firstName: {contains: search}},
        {lastName: {contains: search}},
        {receivingEthereumAddress: {contains: search}},
        {contribution: {contains: search}}
      ];
    }

    Promise.all([
      Whitelist.find({ where, sort }).paginate({page, limit}),
      Whitelist.count(where)
    ])
      .then(([data, count]) => ({data, count, pages: Math.ceil(count / limit)}))
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
