/**
 * AddressHistoryController
 *
 * @description :: Server-side logic for managing Addresshistories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global AddressHistory */

module.exports = {

  /**
   * `AddressHistoryController.index()`
   */
  index: function (req, res) {
    AddressHistory.find({where: {user: req.user.id}, sort: 'updatedAt DESC'})
      .then(records => records.reduce((result, r) => {
        if (!result[r.type]) {
          result[r.type] = [];
        }

        result[r.type].push({address: r.address, updatedAt: r.updatedAt});

        return result;
      }, {}))
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
