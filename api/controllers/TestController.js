/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails EtherscanService BitstampService ExchangeRates */

module.exports = {
  txlist: function (req, res) {
    EtherscanService.txlist({address: sails.config.koraEtherWallet})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  txlistcb: function (req, res) {
    EtherscanService.txlist({address: sails.config.koraEtherWallet}, (err, result) => {
      if (err) {
        return res.negotiate(err);
      }

      return res.ok(result);
    });
  },

  tickerHourBtcUsd: function (req, res) {
    BitstampService.tickerHourBtcUsd()
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  tickerHourEthUsd: function (req, res) {
    BitstampService.tickerHourEthUsd()
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  lastExchangeRate: function (req, res) {
    ExchangeRates.findLast({type: 'ETH'})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  lastExchangeRates: function (req, res) {
    ExchangeRates.findLastByTypes()
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
