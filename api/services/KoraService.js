/**
 * KoraService
 * @description :: Kora wallets and KNT exchange rates service
 */

/* global sails MiscService TotalAmount Sale */

module.exports = {
  wallets: function (cb) {
    let promise = Promise.resolve({
      BTC: sails.config.koraBitcoinWallet,
      ETH: sails.config.koraEtherWallet
    });

    return MiscService.cbify(promise, cb);
  },

  saleValues: function ({needDiscountMVP = false}, cb) {
    let promise = Sale.findLast()
      .then(({
        isDiscount,
        isPublicSale,
        discountMVP,
        USD_KNT,
        KNT_USD,
        USD_KNT_MVP,
        KNT_USD_MVP,
        preSale,
        publicSale
      }) => {
        const noDiscountSale = { USD_KNT, KNT_USD, discount: 0, nextDiscount: null };
        const currentSale = isPublicSale ? publicSale : preSale;
        const types = TotalAmount.constants.types;

        return !isDiscount ? Promise.resolve(noDiscountSale)
          : TotalAmount.findLast({type: isPublicSale ? types.publicSale : types.preSale})
            .then(({USD, KNT}) => {
              let i = currentSale.findIndex(s => (USD <= s.fullAmountUSD));
              let s = currentSale[i];

              if (s) {
                return {
                  needDiscountMVP,
                  discountMVP,
                  discount: s.discount,
                  nextDiscount: currentSale[i + 1] ? currentSale[i + 1].discount : null,
                  USD_KNT: s.USD_KNT,
                  KNT_USD: s.KNT_USD,
                  USD_KNT_MVP: s.KNT_USD_MVP,
                  KNT_USD_MVP: s.KNT_USD_MVP
                };
              }

              return Object.assign({noDiscountSale}, {
                needDiscountMVP,
                discountMVP,
                USD_KNT_MVP,
                KNT_USD_MVP
              });
            });
      });

    return MiscService.cbify(promise, cb);
  },

  calcKNT: function ({valueUSD, needDiscountMVP}, cb) {
    let promise = Sale.findLast()
      .then(({ isDiscount, isPublicSale, KNT_USD, KNT_USD_MVP, preSale, publicSale }) => {
        const currentSale = isPublicSale ? publicSale : preSale;
        const types = TotalAmount.constants.types;

        return !isDiscount ? Promise.resolve(+(valueUSD / KNT_USD).toFixed(10))
          : TotalAmount.findLast({type: isPublicSale ? types.publicSale : types.preSale})
            .then(({USD: totalUSD}) => {
              let i = currentSale.findIndex(s => (totalUSD <= s.fullAmountUSD));

              return convertUSDKNT({ i, currentSale, valueUSD, totalUSD, needDiscountMVP, KNT_USD, KNT_USD_MVP });
            });
      });

    return MiscService.cbify(promise, cb);
  },

  calcUSD: function ({valueKNT, needDiscountMVP}, cb) {
    let promise = Sale.findLast()
      .then(({ isDiscount, isPublicSale, KNT_USD, KNT_USD_MVP, preSale, publicSale }) => {
        const currentSale = isPublicSale ? publicSale : preSale;
        const types = TotalAmount.constants.types;

        return !isDiscount ? Promise.resolve(+(valueKNT * KNT_USD).toFixed(10))
          : TotalAmount.findLast({type: isPublicSale ? types.publicSale : types.preSale})
            .then(({USD: totalUSD, KNT: totalKNT}) => {
              let i = currentSale.findIndex(s => (totalKNT <= s.fullAmountKNT));

              return convertKNTUSD({ i, currentSale, valueKNT, totalUSD, totalKNT, needDiscountMVP, KNT_USD, KNT_USD_MVP });
            });
      });

    return MiscService.cbify(promise, cb);
  }
};

function convertUSDKNT ({i, currentSale, valueUSD, totalUSD, needDiscountMVP, KNT_USD, KNT_USD_MVP}) {
  let result;
  let s = currentSale[i];

  if (s) {
    let remainAmountUSD = +(s.fullAmountUSD - totalUSD).toFixed(10);
    let currentKTNUSD = needDiscountMVP ? s.KNT_USD_MVP : s.KNT_USD;

    if (remainAmountUSD < valueUSD) {
      result = remainAmountUSD / currentKTNUSD + convertUSDKNT({
        i: i + 1,
        currentSale,
        valueUSD: +(valueUSD - remainAmountUSD).toFixed(10),
        totalUSD: s.fullAmountUSD,
        needDiscountMVP,
        KNT_USD,
        KNT_USD_MVP
      });
    } else {
      result = valueUSD / currentKTNUSD;
    }
  } else {
    result = valueUSD / (needDiscountMVP ? KNT_USD_MVP : KNT_USD);
  }

  return +(result).toFixed(10);
}

function convertKNTUSD ({i, currentSale, valueKNT, totalUSD, totalKNT, needDiscountMVP, KNT_USD, KNT_USD_MVP}) {
  let result;
  let s = currentSale[i];

  if (s) {
    let remainAmountKNT = +(s.fullAmountKNT - totalKNT).toFixed(10);
    let currentKTNUSD = needDiscountMVP ? s.KNT_USD_MVP : s.KNT_USD;

    if (remainAmountKNT < valueKNT) {
      result = remainAmountKNT * currentKTNUSD + convertKNTUSD({
        i: i + 1,
        currentSale,
        valueKNT: +(valueKNT - remainAmountKNT).toFixed(10),
        totalKNT: s.fullAmountKNT,
        needDiscountMVP,
        KNT_USD,
        KNT_USD_MVP
      });
    } else {
      result = valueKNT * currentKTNUSD;
    }
  } else {
    result = valueKNT * (needDiscountMVP ? KNT_USD_MVP : KNT_USD);
  }

  return +(result).toFixed(10);
}
