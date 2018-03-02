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
      TotalAmount.findLast({type: TotalAmount.constants.types.preSale}),
      TotalAmount.findLast({type: TotalAmount.constants.types.publicSale}),
      TotalAmount.findLast({type: TotalAmount.constants.types.allocateKNT}),
      Sale.findLast()
    ])
      .then(([TAPreSale, TAPublicSale, TAAllocateKNT, sale]) => {
        let currentSale = sale.isPublicSale ? sale.publicSale : sale.preSale;
        let currentUSD = sale.isPublicSale ? TAPublicSale.USD : TAPreSale.USD;
        let i = currentSale.findIndex(s => (currentUSD <= s.fullAmountUSD));

        return {
          total: {
            discount: currentSale[i] ? currentSale[i].discount : 0,
            nextDiscount: currentSale[i + 1] ? currentSale[i + 1].discount : null,
            currentAmountUSD: +(TAPreSale.USD + TAPublicSale.USD).toFixed(10),
            currentAmountKNT: +(TAPreSale.KNT + TAPublicSale.KNT).toFixed(10),
            expectedAmountUSD: sale.totalAmountUSD,
            expectedAmountKNT: sale.totalAmountKNT,
            adminAmountUSD: TAAllocateKNT.USD,
            adminAmountKNT: TAAllocateKNT.KNT
          },
          sale: Sale.mapRecord(sale, sale.isPublicSale ? TAPublicSale.USD : TAPreSale.USD)
        };
      })
      .then(result => res.json(result))
      .catch(err => res.negotiate(err));
  }
};
