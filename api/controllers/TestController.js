/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails EtherscanService */
module.exports = {
  txlist: function (req, res) {
    EtherscanService.txlist({address: sails.config.koraEtherWallet})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  txlistcb: function (req, res) {
    EtherscanService.txlist({address: sails.config.koraEtherWallet}, (err, result) => {
      if (err) {
        return res.negotiate(err);
      }

      return res.ok(result);
    });
  }
};
