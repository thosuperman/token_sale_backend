/**
 * TotalAmount.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global MiscService */

module.exports = {

  attributes: {
    USD: { type: 'float', required: true },

    KNT: { type: 'float', required: true },

    transaction: { model: 'transactions', required: true }
  },

  findLast: function (cb) {
    let promise = this.find({sort: 'updatedAt DESC', limit: 1})
      .then(([record]) => record || {USD: 0, KNT: 0});

    return MiscService.cbify(promise, cb);
  },

  addNew: function ({USD, KNT, transaction}, cb) {
    let promise = this.findLast()
      .then(lastRecord => this.create({
        USD: +(lastRecord.USD + USD).toFixed(10),
        KNT: +(lastRecord.KNT + KNT).toFixed(10),
        transaction
      }));

    return MiscService.cbify(promise, cb);
  }
};
