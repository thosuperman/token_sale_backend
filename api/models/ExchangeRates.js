/**
 * ExchangeRates.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ MiscService */

const types = {
  BTC: 'BTC',
  ETH: 'ETH'
};
const typesList = _.values(types);

module.exports = {
  constants: {
    types,
    typesList
  },

  attributes: {
    type: { type: 'string', in: typesList, required: true },

    raw: { type: 'json', required: true },

    date: { type: 'date', required: true },

    USD: { type: 'float', required: true },

    toJSON: function () {
      var obj = this.toObject();

      delete obj.raw;

      return obj;
    }

  },

  indexes: [
    { attributes: { date: -1 } }
  ],

  beforeValidate: function (values, cb) {
    if (values.raw) {
      if (values.raw.timestamp) {
        values.date = new Date(values.raw.timestamp * 1000);
      }

      if (values.raw.vwap) {
        values.USD = parseFloat(values.raw.vwap, 10);
      }
    }

    return cb();
  },

  findLast: function ({type}, cb) {
    let promise = this.findOne({where: {type}, sort: 'date DESC'});

    return MiscService.cbify(promise, cb);
  },

  findLastByTypes: function (cb) {
    let promise = Promise.all([
      this.findLast({type: types.BTC}),
      this.findLast({type: types.ETH})
    ]);

    return MiscService.cbify(promise, cb);
  }
};
