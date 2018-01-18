/**
 * Sale.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global MiscService */

const defaultRecord = {
  isDiscount: true,
  isPublicSale: false,
  discountMVP: 2,
  USD_KNT: 10,
  preSale: [
    {discount: 90, amountUSD: 500000, note: 'Reserved for core team and early advisors.'},
    {discount: 65, amountUSD: 500000, note: 'Reserved for early advisors and Contributors.'},
    {discount: 55, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
    {discount: 50, amountUSD: 500000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
    {discount: 45, amountUSD: 1000000, note: 'Restricted to HNW, VC and accredited Contributors if in USA.'},
    {discount: 40, amountUSD: 1000000, note: 'Restricted to early members of community.'}
  ],
  publicSale: [
    {discount: 30, amountUSD: 2500000, note: 'Open to the public.'},
    {discount: 25, amountUSD: 2500000, note: 'Open to the public.'},
    {discount: 20, amountUSD: 2500000, note: 'Open to the public.'},
    {discount: 15, amountUSD: 2500000, note: 'Open to the public.'},
    {discount: 10, amountUSD: 5000000, note: 'Open to the public.'},
    {discount: 0, amountUSD: 5000000, note: 'Open to the public.'}
  ]
};

module.exports = {

  attributes: {
    isDiscount: { type: 'boolean', defaultsTo: defaultRecord.isDiscount },

    isPublicSale: { type: 'boolean', defaultsTo: defaultRecord.isPublicSale },

    discountMVP: { type: 'float', defaultsTo: defaultRecord.discountMVP },

    USD_KNT: { type: 'float', required: true, defaultsTo: defaultRecord.USD_KNT },

    preSale: { type: 'json', required: true, defaultsTo: defaultRecord.preSale },

    publicSale: { type: 'json', required: true, defaultsTo: defaultRecord.publicSale },

    user: { model: 'user', required: true },

    toJSON: function () {
      let obj = this.toObject();

      obj = mapRecord(obj);

      delete obj.sale;

      return obj;
    }
  },

  findLast: function (cb) {
    let promise = this.find({sort: 'updatedAt DESC', limit: 1})
      .then(([record]) => mapRecord(record || defaultRecord));

    return MiscService.cbify(promise, cb);
  }
};

function mapRecord (record) {
  record.KNT_USD = +(1 / record.USD_KNT).toFixed(10);
  record.USD_KNT_MVP = +(record.USD_KNT * 100 / (100 - record.discountMVP)).toFixed(10);
  record.KNT_USD_MVP = +(1 / record.USD_KNT_MVP).toFixed(10);

  record.preSale = mapSale(record, record.preSale);
  record.publicSale = mapSale(record, record.publicSale);

  record.totalAmountUSD = record.preSale[record.preSale.length - 1].fullAmountUSD +
                          record.publicSale[record.publicSale.length - 1].fullAmountUSD;
  record.totalAmountKNT = record.preSale[record.preSale.length - 1].fullAmountKNT +
                          record.publicSale[record.publicSale.length - 1].fullAmountKNT;

  // record.sale = record.isPublicSale ? record.publicSale : record.preSale;

  return record;
}

function mapSale (record, sale) {
  return sale.map((s, i, arr) => {
    s.USD_KNT = +(record.USD_KNT * 100 / (100 - s.discount)).toFixed(10);
    s.KNT_USD = +(1 / s.USD_KNT).toFixed(10);
    s.amountKNT = +(s.USD_KNT * s.amountUSD).toFixed(10);
    s.fullAmountUSD = i === 0 ? s.amountUSD : +(arr[i - 1].fullAmountUSD + s.amountUSD).toFixed(10);
    s.fullAmountKNT = i === 0 ? s.amountKNT : +(arr[i - 1].fullAmountKNT + s.amountKNT).toFixed(10);
    s.USD_KNT_MVP = +(s.USD_KNT * 100 / (100 - record.discountMVP)).toFixed(10);
    s.KNT_USD_MVP = +(1 / s.USD_KNT_MVP).toFixed(10);

    return s;
  });
}