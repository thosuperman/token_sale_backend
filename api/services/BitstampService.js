/**
 * BitstampService
 *
 * description:: bitstamp api service
 */

/* global MiscService */

const Bitstamp = require('bitstamp');
const bitstamp = new Bitstamp();

module.exports = {
  tickerHour,

  tickerHourBtcUsd: cb => tickerHour({currencyPair: 'btcusd'}, cb),

  tickerHourEthUsd: cb => tickerHour({currencyPair: 'ethusd'}, cb)
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
