/**
 * KoraService
 * @description :: Kora wallets and KNT exchange rates service (fake yet)
 */

/* global sails MiscService TotalAmount */

const USD_KNT = 10;

const preSaleRaw = [
  {discount: 90, amountUSD: 500000, note: 'Reserved for core team and early advisors.'},
  {discount: 65, amountUSD: 500000, note: 'Reserved for early advisors and Contributors.'},
  {discount: 55, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 50, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 45, amountUSD: 1000000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
  {discount: 40, amountUSD: 1000000, note: 'Restricted to early members of community.'}
];

const preSale = preSaleRaw.map((s, i, arr) => {
  // s.amountUSD = s.amountUSD / 100; // TODO: Remove after testing
  s.USD_KNT = +(USD_KNT * 100 / (100 - s.discount)).toFixed(10);
  s.KNT_USD = +(1 / s.USD_KNT).toFixed(10);
  s.amountKNT = +(s.USD_KNT * s.amountUSD).toFixed(10);
  s.fullAmountUSD = i === 0 ? s.amountUSD : +(arr[i - 1].fullAmountUSD + s.amountUSD).toFixed(10);

  return s;
});

sails.log.info('Pre-sale info:', preSale);

module.exports = {
  wallets: function (cb) {
    let promise = Promise.resolve({
      BTC: sails.config.koraBitcoinWallet,
      ETH: sails.config.koraEtherWallet
    });

    return MiscService.cbify(promise, cb);
  },

  saleValues: function (cb) {
    let promise = TotalAmount.findLast()
      .then(({USD, KNT}) => {
        let i = preSale.findIndex(s => (USD <= s.fullAmountUSD));

        if (i === -1) {
          i = preSale.length - 1;
        }

        return {
          currentIndex: i,
          current: preSale[i],
          next: preSale[i + 1],
          currentAmountUSD: USD,
          currentAmountKNT: KNT,
          currentRemainAmountUSD: +(preSale[i].fullAmountUSD - USD).toFixed(10),
          preSale
        };
      });
    // Promise.resolve({
    //   KNT_USD: sails.config.koraExchangeRate
    // });

    return MiscService.cbify(promise, cb);
  }
};
