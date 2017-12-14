/**
 * ValuesController
 *
 * @description :: Server-side logic for managing values
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Transactions ExchangeRates MiscService */

module.exports = {

  /**
   * `ValuesController.index()`
   */
  index: function (req, res) {
    Promise.all([
      calcUserKNTBalance({userId: req.user.id}),
      ExchangeRates.findLastByTypes()
    ])
      .then(([KNTBalance, exchangeRates]) => {
        let result = exchangeRates.reduce((previous, {type, USD}) => {
          previous[type + '_USD'] = USD;

          return previous;
        }, {KNTBalance});

        return result;
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};

function calcUserKNTBalance ({userId}, cb) {
  let promise = Transactions.find({ from: userId })
    .then(records => {
      if (!records) {
        return 0;
      }

      return records.reduce((sum, tx) => {
        sum += tx.KNT;
        return sum;
      }, 0);
    })
    .then(sum => +sum.toFixed(10));

  return MiscService.cbify(promise, cb);
}
