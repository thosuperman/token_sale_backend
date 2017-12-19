/**
 * KoraService
 * @description :: Kora wallets and KNT exchange rates service (fake yet)
 */

/* global sails MiscService TotalAmount */

const isDiscount = true;
const isPreSale = true;

const USD_KNT = 10;
const KNT_USD = +(1 / USD_KNT).toFixed(10);

const preSaleRaw = [
  {discount: 90, amountUSD: 500000, note: 'Reserved for core team and early advisors.'},
  {discount: 65, amountUSD: 500000, note: 'Reserved for early advisors and Contributors.'},
  {discount: 55, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 50, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 45, amountUSD: 1000000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 40, amountUSD: 1000000, note: 'Restricted to early members of community.'}
];

const publicSaleRaw = [
  {discount: 30, amountUSD: 2500000, note: 'Open to the public.'},
  {discount: 25, amountUSD: 2500000, note: 'Open to the public.'},
  {discount: 20, amountUSD: 2500000, note: 'Open to the public.'},
  {discount: 15, amountUSD: 2500000, note: 'Open to the public.'},
  {discount: 10, amountUSD: 5000000, note: 'Open to the public.'},
  {discount: 0, amountUSD: 5000000, note: 'Open to the public.'}
];

const saleRaw = isPreSale ? preSaleRaw : publicSaleRaw;

const sale = saleRaw.map((s, i, arr) => {
  s.USD_KNT = +(USD_KNT * 100 / (100 - s.discount)).toFixed(10);
  s.KNT_USD = +(1 / s.USD_KNT).toFixed(10);
  s.amountKNT = +(s.USD_KNT * s.amountUSD).toFixed(10);
  s.fullAmountUSD = i === 0 ? s.amountUSD : +(arr[i - 1].fullAmountUSD + s.amountUSD).toFixed(10);

  return s;
});

// sails.log.info('Pre-sale info:', sale);

module.exports = {
  wallets: function (cb) {
    let promise = Promise.resolve({
      BTC: sails.config.koraBitcoinWallet,
      ETH: sails.config.koraEtherWallet
    });

    return MiscService.cbify(promise, cb);
  },

  saleValues: function ({needDiscount = false}, cb) {
    let promise = !(isDiscount && needDiscount)
      ? Promise.resolve({ USD_KNT, KNT_USD, discount: 0 })
      : TotalAmount.findLast()
          .then(({USD, KNT}) => {
            let s = sale.find(s => (USD <= s.fullAmountUSD));

            return {
              USD_KNT,
              KNT_USD,
              discount: !s ? 0 : s.discount
            };
          });

    return MiscService.cbify(promise, cb);
  },

  calcKNT: function ({valueUSD, needDiscount}, cb) {
    let promise = !(isDiscount && needDiscount)
      ? Promise.resolve(+(valueUSD * KNT_USD).toFixed(10))
      : TotalAmount.findLast()
          .then(({USD: totalUSD}) => {
            let i = sale.findIndex(s => (totalUSD <= s.fullAmountUSD));

            return convertUSDKNT({ i, valueUSD, totalUSD });
          });

    return MiscService.cbify(promise, cb);
  }
};

function convertUSDKNT ({i, valueUSD, totalUSD}) {
  let result;
  let s = sale[i];

  if (s) {
    let remainAmountUSD = +(s.fullAmountUSD - totalUSD).toFixed(10);

    if (remainAmountUSD < valueUSD) {
      result = remainAmountUSD * s.KNT_USD + convertUSDKNT({
        i: i + 1,
        valueUSD: +(valueUSD - remainAmountUSD).toFixed(10),
        totalUSD: s.fullAmountUSD
      });
    } else {
      result = valueUSD * s.KNT_USD;
    }
  } else {
    result = valueUSD * KNT_USD;
  }

  return +(result).toFixed(10);
}
