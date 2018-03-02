/**
 * TotalAmount.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global MiscService */

const typesList = ['preSale', 'publicSale', 'allocateKNT'];
const types = MiscService.mapArrayToConstantsObject(typesList);

module.exports = {

  constants: {
    types,
    typesList
  },

  attributes: {
    type: { type: 'string', in: typesList, required: true },

    USD: { type: 'float', required: true },

    KNT: { type: 'float', required: true },

    transaction: { model: 'transactions', required: true }
  },

  indexes: [
    { attributes: { updatedAt: -1 } }
  ],

  findLast: function ({type}, cb) {
    let promise = this.find({where: {type}, sort: 'updatedAt DESC', limit: 1})
      .then(([record]) => record || {type, USD: 0, KNT: 0});

    return MiscService.cbify(promise, cb);
  },

  addNew: function ({type, USD, KNT, transaction}, cb) {
    let promise = this.findLast({type})
      .then(lastRecord => this.create({
        type,
        USD: +(lastRecord.USD + USD).toFixed(10),
        KNT: +(lastRecord.KNT + KNT).toFixed(10),
        transaction
      }));

    return MiscService.cbify(promise, cb);
  }
};
