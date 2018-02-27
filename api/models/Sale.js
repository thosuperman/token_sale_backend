/**
 * Sale.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ MiscService ValidationService TotalAmount */

const defaultRecord = {
  isDiscount: true,
  isPublicSale: false,
  discountMVP: 5,
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
    isDiscount: { type: 'boolean', required: true, defaultsTo: defaultRecord.isDiscount },

    isPublicSale: { type: 'boolean', required: true, defaultsTo: defaultRecord.isPublicSale },

    discountMVP: { type: 'float', required: true, defaultsTo: defaultRecord.discountMVP },

    USD_KNT: { type: 'float', required: true, defaultsTo: defaultRecord.USD_KNT },

    preSale: { type: 'json', required: true, saleArray: true, defaultsTo: defaultRecord.preSale },

    publicSale: { type: 'json', required: true, saleArray: true, defaultsTo: defaultRecord.publicSale },

    user: { model: 'user', required: true }

    // toJSON: function () {
    //   let obj = this.toObject();
    //
    //   return obj;
    // }
  },

  types: {
    saleArray: value => ValidationService.saleArray(value)
  },

  beforeValidate: function (values, cb) {
    this.findLast((err, last) => {
      if (err) {
        return cb(err);
      }

      // For prevent editing this fields
      values.isDiscount = last.isDiscount;
      values.discountMVP = last.discountMVP;

      // Admin can only once switch to public sale
      if (last.isPublicSale) {
        values.isPublicSale = true;
      }

      values.preSale = (values.preSale && !last.isPublicSale) ? saleArrayParse(values.preSale) : last.preSale;

      values.publicSale = (values.publicSale && last.isPublicSale) ? saleArrayParse(values.publicSale) : last.publicSale;

      return cb();
    });
  },

  beforeCreate: function (values, cb) {
    delete values.id;
    delete values.createdAt;
    delete values.updatedAt;

    return cb();
  },

  findLast: function (cb) {
    let promise = this.find({sort: 'updatedAt DESC', limit: 1})
      .then(([record]) => mapRecord(record || _.cloneDeep(defaultRecord)));

    return MiscService.cbify(promise, cb);
  },

  calcDisabled: function (record, cb) {
    let types = TotalAmount.constants.types;

    let promise = TotalAmount.findLast({type: record.isPublicSale ? types.publicSale : types.preSale})
      .then(({USD}) => mapRecord(record, USD));

    return MiscService.cbify(promise, cb);
  },

  mapRecord
};

function mapRecord (record, USD) {
  record.KNT_USD = +(1 / record.USD_KNT).toFixed(10);
  record.USD_KNT_MVP = +(record.USD_KNT * 100 / (100 - record.discountMVP)).toFixed(10);
  record.KNT_USD_MVP = +(1 / record.USD_KNT_MVP).toFixed(10);

  record.preSale = mapSale(record, record.preSale, record.isPublicSale ? null : USD);
  record.publicSale = mapSale(record, record.publicSale, record.isPublicSale ? USD : null);

  record.totalAmountUSD = record.preSale[record.preSale.length - 1].fullAmountUSD +
                          record.publicSale[record.publicSale.length - 1].fullAmountUSD;
  record.totalAmountKNT = record.preSale[record.preSale.length - 1].fullAmountKNT +
                          record.publicSale[record.publicSale.length - 1].fullAmountKNT;

  // record.sale = record.isPublicSale ? record.publicSale : record.preSale;

  return record;
}

function mapSale (record, sale, USD) {
  return sale.map((s, i, arr) => {
    s.USD_KNT = +(record.USD_KNT * 100 / (100 - s.discount)).toFixed(10);
    s.KNT_USD = +(1 / s.USD_KNT).toFixed(10);
    s.amountKNT = +(s.USD_KNT * s.amountUSD).toFixed(10);
    s.fullAmountUSD = i === 0 ? s.amountUSD : +(arr[i - 1].fullAmountUSD + s.amountUSD).toFixed(10);
    s.fullAmountKNT = i === 0 ? s.amountKNT : +(arr[i - 1].fullAmountKNT + s.amountKNT).toFixed(10);
    s.USD_KNT_MVP = +(s.USD_KNT * 100 / (100 - record.discountMVP)).toFixed(10);
    s.KNT_USD_MVP = +(1 / s.USD_KNT_MVP).toFixed(10);

    s.disabled = (USD == null) || (s.fullAmountUSD - USD <= s.amountUSD);

    return s;
  });
}

function saleArrayParse (sale) {
  return Array.isArray(sale) && sale.map(s => ({
    discount: parseFloat(s.discount),
    amountUSD: parseFloat(s.amountUSD)
  }));
  // NOTE: If need saleArray sort logic
  // .sort((a, b) => (a.discount < b.discount));
}
