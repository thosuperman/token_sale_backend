/**
 * ManageTokensController
 *
 * @description :: Server-side logic for managing Managetokens
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Sale TotalAmount */

module.exports = {

  /**
   * `ManageTokensController.index()`
   */
  index: function (req, res) {
    Promise.all([
      TotalAmount.findLast(),
      Sale.findLast()
    ])
      .then(([{USD, KNT}, sale]) => {
        let currentSale = sale.isPublicSale ? sale.publicSale : sale.preSale;
        let s = currentSale.find(s => (USD <= s.fullAmountUSD));

        return {
          total: {
            discount: s ? s.discount : 0,
            currentAmountUSD: USD,
            currentAmountKNT: KNT,
            expectedAmountUSD: sale.totalAmountUSD,
            expectedAmountKNT: sale.totalAmountKNT,
            // TODO: Change adminAmountKNT when will be admin KNT logic
            adminAmountKNT: 0
          },
          sale
        };
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
