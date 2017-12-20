/**
 * ValidationService
 * @description :: Set of validation functions
 */

const Web3Utils = require('web3-utils');
const WAValidator = require('wallet-address-validator');

module.exports = {
  phoneNumber: value => /^[1-9]\d{9,12}$/i.test(value),

  ethereumAddress: value => Web3Utils.isAddress(value),

  hex: value => Web3Utils.isHex(value),

  bitcoinAddress: value => WAValidator.validate(value),

  password: value => /^(?=.*\d)(?=.*[a-zA-Z]).{9,}$/.test(value)
};
