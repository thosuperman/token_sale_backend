/**
 * Transactions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ MiscService User KoraService TotalAmount ExchangeRates BlockchainService */

const Web3Utils = require('web3-utils');

const types = {
  BTC: 'BTC Purchase',
  ETH: 'ETH Purchase',
  KNT: 'KNT Withdrawal'
};
const typesList = _.values(types);

const statuses = {
  pending: 'Pending',
  confirmed: 'Confirmed'
};
const statusesList = _.values(statuses);

const CONFIRMATIONS_NUM = 6;

module.exports = {
  constants: {
    types,
    typesList,
    statuses,
    statusesList
  },

  attributes: {
    type: { type: 'string', in: typesList, required: true },

    status: { type: 'string', in: statusesList, defaultsTo: statuses.pending },

    raw: { type: 'json', required: true },

    date: { type: 'date', required: true },

    hash: { type: 'string', unique: true },

    confirmations: { type: 'integer' },

    value: { type: 'float' },

    USD: { type: 'float' },

    KNT: { type: 'float' },

    exchangeRate: { model: 'exchangerates' },

    from: { model: 'user' }
  },

  indexes: [
    {
      attributes: { from: 1 }
    }, {
      attributes: { hash: 1 },
      options: { unique: true }
    }
  ],

  beforeValidate: function (values, cb) {
    if (values.raw) {
      if (typeof values.raw.confirmations !== 'undefined') {
        values.confirmations = parseInt(values.raw.confirmations, 10);

        if (values.confirmations >= CONFIRMATIONS_NUM) {
          values.status = statuses.confirmed;
        }
      }
    }

    return cb();
  },

  beforeCreate: function (values, cb) {
    if (values.raw) {
      let promises = [];

      if (values.raw.value && values.type) {
        let exchangeRateType;

        if (values.type === types.ETH) {
          values.value = +Web3Utils.fromWei(values.raw.value, 'ether');
          exchangeRateType = ExchangeRates.constants.types.ETH;
        }

        if (values.type === types.BTC) {
          values.value = +BlockchainService.toBTC(values.raw.value);
          exchangeRateType = ExchangeRates.constants.types.BTC;
        }

        let date = values.date || new Date();

        promises.push(
          ExchangeRates.findOne({
            where: {
              type: exchangeRateType,
              date: {'<=': date}
            },
            sort: 'date DESC'
          })
          .then(record => {
            if (!record) {
              return ExchangeRates.findOne({
                where: {
                  type: exchangeRateType,
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
  },

  findNotConfirmed: function ({type}, cb) {
    let promise = this.find({
      where: {
        type,
        confirmations: { '<': CONFIRMATIONS_NUM }
      },
      sort: 'date DESC'
    });

    return MiscService.cbify(promise, cb);
  }
};
