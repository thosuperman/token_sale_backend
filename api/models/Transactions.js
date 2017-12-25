/**
 * Transactions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global MiscService User KoraService TotalAmount ExchangeRates BlockchainService */

const Web3Utils = require('web3-utils');

const {constants} = require('./ExchangeRates');

const types = constants.types;
const typesList = constants.typesList;

module.exports = {
  constants: {
    types,
    typesList
  },

  attributes: {
    type: { type: 'string', in: typesList, required: true },

    raw: { type: 'json', required: true },

    date: { type: 'date', required: true },

    hash: { type: 'string' },

    // confirmations: { type: 'integer' },

    value: { type: 'float' },

    USD: { type: 'float' },

    KNT: { type: 'float' },

    exchangeRate: { model: 'exchangerates' },

    from: { model: 'user' }
  },

  indexes: [
    { attributes: { from: 1 } }
  ],

  beforeValidate: function (values, cb) {
    if (values.raw) {
      // Etherscan
      if (values.raw.timeStamp) {
        values.date = new Date(values.raw.timeStamp * 1000);
      }

      // Bitstamp
      if (values.raw.time) {
        values.date = new Date(values.raw.time);
      }

      if (values.raw.hash) {
        values.hash = values.raw.hash;
      }

      // if (values.raw.confirmations) {
      //   values.confirmations = parseInt(values.raw.confirmations, 10);
      // }

      let promises = [];

      if (values.raw.value && values.type) {
        if (values.type === types.ETH) {
          values.value = +Web3Utils.fromWei(values.raw.value, 'ether');
        }

        if (values.type === types.BTC) {
          values.value = +BlockchainService.toBTC(values.raw.value);
        }

        let date = values.date || new Date();

        promises.push(
          ExchangeRates.findOne({
            where: {
              type: values.type,
              date: {'<=': date}
            },
            sort: 'date DESC'
          })
          .then(record => {
            if (!record) {
              return ExchangeRates.findOne({
                where: {
                  type: values.type,
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

      if (values.raw.from && values.type) {
        let key;

        if (values.type === types.ETH) {
          key = 'sendingEthereumAddress';
        }

        if (values.type === types.BTC) {
          key = 'bitcoinAddress';
        }

        promises.push(
          User.findOne({[key]: values.raw.from})
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
  // },
  //
  // findNotConfirmed: function ({type}, cb) {
  //   let promise = this.find({
  //     where: {
  //       type,
  //       confirmations: { '<=': 1 }
  //     },
  //     sort: 'date DESC'
  //   });
  //
  //   return MiscService.cbify(promise, cb);
  }
};
