/**
 * ValidationService
 * @description :: Set of validation functions
 */

/* global sails */

const {blockchains: {testnet}} = sails.config;

const Web3Utils = require('web3-utils');
const WAValidator = require('wallet-address-validator');
const validator = require('validator');

module.exports = {
  phoneNumber: value => /^[1-9]\d{9,12}$/i.test(value),

  ethereumAddress: value => Web3Utils.isAddress(value),

  hex: value => Web3Utils.isHex(value),

  bitcoinAddress: value => WAValidator.validate(value, 'bitcoin', (testnet ? 'both' : 'prod')),

  password: value => /^(?=.*\d)(?=.*[a-zA-Z]).{9,}$/.test(value),

  postalCode: value => validator.isPostalCode(value + '', 'any'),

  escape: value => validator.escape(value + '')
};
