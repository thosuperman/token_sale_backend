/**
 * ValidationService
 * @description :: Set of validation functions
 */

/* global sails */

const {blockchains: {testnet}} = sails.config;

const Web3Utils = require('web3-utils');
const WAValidator = require('wallet-address-validator');
const validator = require('validator');

const floatMin0 = value => validator.isFloat(value + '', {min: 0});

module.exports = {
  phoneNumber: value => /^[1-9]\d{7,12}$/i.test(value),

  ethereumAddress: value => /^0x/.test(value) && Web3Utils.isAddress(value),

  hex: value => Web3Utils.isHex(value),

  bitcoinAddress: value => WAValidator.validate(value, 'bitcoin', (testnet ? 'both' : 'prod')),

  password: value => /^(?=.*\d)(?=.*[a-zA-Z]).{9,}$/.test(value),

  postalCode: value => validator.isPostalCode(value + '', 'any'),

  escape: value => validator.escape(value + ''),

  float: value => validator.isFloat(value + ''),

  email: value => validator.isEmail(value + ''),

  floatMin0,

  saleArray: value => Array.isArray(value) && value.every(s => (floatMin0(s.discount) && floatMin0(s.amountUSD)))
};
