/**
 * Transactions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global sails _ MiscService User ExchangeRates KoraService TotalAmount */

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
          Promise.all([
            KoraService.saleValues(),
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
          ])
          .then(([saleValues, exchangeRate]) => {
            if (exchangeRate) {
              values.USD = +(values.value * exchangeRate.USD).toFixed(10);
              values.exchangeRate = exchangeRate.id;

              // TODO: Need complete this logic
              if (saleValues.next && saleValues.currentRemainAmountUSD < values.USD) {
                values.KNT = +(
                  saleValues.currentRemainAmountUSD * saleValues.current.KNT_USD +
                  (values.USD - saleValues.currentRemainAmountUSD) * saleValues.next.KNT_USD
                ).toFixed(10);
              } else {
                values.KNT = +(values.USD * saleValues.current.KNT_USD).toFixed(10);
              }
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
              }
            })
        );
      }

      if (promises.length) {
        return Promise.all(promises)
          .then(() => cb())
          .catch(err => cb(err));
      }
    }

    return cb();
  },

  afterCreate: function ({id, USD, KNT}, cb) {
    TotalAmount.addNew({USD, KNT, transaction: id})
      .then(() => cb())
      .catch(err => cb(err));
  },

  findLast: function ({type}, cb) {
    let promise = this.findOne({where: {type}, sort: 'date DESC'});

    return MiscService.cbify(promise, cb);
  }
};
