/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails EtherscanService BitstampService ExchangeRates KoraService BlockchainService OnfidoService */

module.exports = {

  _config: {
    actions: (sails.config.environment === 'development')
  },

  blocktrailTxs: function (req, res) {
    const {address, page, limit, sortDir} = req.allParams();

    BlockchainService.addressTransactions({
      address: address || '2NB2jorwjeRsxUhsLjq5oTH334f3TUys26e',
      page,
      limit,
      sortDir
    })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  blockchainInfoTxs: function (req, res) {
    const address = req.param('address');

    BlockchainService.getAddress({address: address || '2NB2jorwjeRsxUhsLjq5oTH334f3TUys26e'})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  txlist: function (req, res) {
    KoraService.wallets()
      .then(({ETH}) => EtherscanService.txlist({address: ETH}))
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  txlistcb: function (req, res) {
    KoraService.wallets((err, {ETH}) => {
      if (err) {
        return res.negotiate(err);
      }

      EtherscanService.txlist({address: ETH}, (err, result) => {
        if (err) {
          return res.negotiate(err);
        }

        return res.ok(result);
      });
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
  },

  session: function (req, res) {
    res.ok({session: req.session, id: req.sessionID});
  },

  applicants: function (req, res) {
    OnfidoService.applicants({id: req.param('id')})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  createApplicant: function (req, res) {
    OnfidoService.createApplicant({body: req.allParams()})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  createCheck: function (req, res) {
    OnfidoService.createCheck({applicantId: req.param('id')})
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  }
};
