/**
 * BitstampService
 *
 * description:: bitstamp api service
 */

/* global _ MiscService */

const Bitstamp = require('bitstamp');
const bitstamp = new Bitstamp();

const currencyPairs = {
  btcusd: 'btcusd',
  ethusd: 'ethusd'
};
const currencyPairsList = _.values(currencyPairs);

module.exports = {
  constants: {
    currencyPairs,
    currencyPairsList
  },

  tickerHour,

  tickerHourBtcUsd: cb => tickerHour({currencyPair: currencyPairs.btcusd}, cb),

  tickerHourEthUsd: cb => tickerHour({currencyPair: currencyPairs.ethusd}, cb)
};

function tickerHour ({currencyPair}, cb) {
  let promise = new Promise((resolve, reject) => {
    bitstamp.ticker_hour(currencyPair, (err, response) => {
      if (err) {
        return reject(err);
      }

      return resolve(response);
    });
  });

  return MiscService.cbify(promise, cb);
}
