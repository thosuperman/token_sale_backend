/**
 * Transactions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ MiscService User ExchangeRates KoraService TotalAmount */

const Web3Utils = require('web3-utils');

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

    value: { type: 'float' },

    USD: { type: 'float' },

    KNT: { type: 'float' },

    exchangeRate: { model: 'exchangerates' },

    from: { model: 'user' }
  },

  beforeValidate: function (values, cb) {
    if (values.raw) {
      if (values.raw.timeStamp) {
        values.date = new Date(values.raw.timeStamp * 1000);
      }

      let promises = [];

      if (values.raw.value) {
        values.value = +Web3Utils.fromWei(values.raw.value, 'ether');

        let date = values.date || new Date();

        promises.push(
          ExchangeRates.findOne({
            where: {
              type: ExchangeRates.constants.types.ETH,
              date: {'<=': date}
            },
            sort: 'date DESC'
          })
          .then(record => {
            if (!record) {
              return ExchangeRates.findOne({
                where: {
                  type: ExchangeRates.constants.types.ETH,
                  date: {'>': date}
                },
                sort: 'date ASC'
              });
            }

            return record;
          })
          .then((exchangeRate) => {
            if (exchangeRate) {
              values.USD = +(values.value * exchangeRate.USD).toFixed(10);
              values.exchangeRate = exchangeRate.id;

              return exchangeRate;
            }
          })
        );
      }

      if (values.raw.from) {
        promises.push(
          User.findOne({sendingEthereumAddress: values.raw.from})
            .then(user => {
              if (user) {
                values.from = user.id;

                return user;
              }
            })
        );
      }

      if (promises.length) {
        let finalPromise = Promise.all(promises);

        if (promises.length === 2) {
          finalPromise = finalPromise
            .then(([exchangeRate, user]) => {
              if (exchangeRate && user) {
                return KoraService.calcKNT({
                  valueUSD: values.USD,
                  needDiscountMVP: user.isMVPUser
                });
              }

              return null;
            })
            .then(valueKNT => {
              if (valueKNT) {
                values.KNT = valueKNT;
              }
            });
        }

        return finalPromise
          .then(() => cb())
          .catch(err => cb(err));
      }
    }

    return cb();
  },

  afterCreate: function ({id, USD, KNT, from}, cb) {
    if (from) {
      return TotalAmount.addNew({USD, KNT, transaction: id})
        .then(() => cb())
        .catch(err => cb(err));
    }

    return cb();
  },

  findLast: function ({type}, cb) {
    let promise = this.findOne({where: {type}, sort: 'date DESC'});

    return MiscService.cbify(promise, cb);
  }
};
