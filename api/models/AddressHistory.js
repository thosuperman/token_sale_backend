/**
 * AddressHistory.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global _ */

const types = {
  bitcoinAddress: 'bitcoinAddress',
  sendingEthereumAddress: 'sendingEthereumAddress',
  receivingEthereumAddress: 'receivingEthereumAddress'
};
const typesList = _.values(types);

module.exports = {

  constants: {
    types,
    typesList
  },

  attributes: {
    type: { type: 'string', in: typesList, required: true },

    user: { model: 'user', required: true },

    address: { type: 'string', required: true }
  },

  indexes: [
    { attributes: { user: 1 } }
  ]
};
