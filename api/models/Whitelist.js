/**
 * Whitelist.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* global CountriesService ValidationService */

module.exports = {

  attributes: {

    email: { type: 'string', unique: true, required: true, email: true },

    firstName: { type: 'string', alpha: true },

    lastName: { type: 'string', alpha: true },

    nationality: { type: 'string', in: CountriesService.codesList },

    receivingEthereumAddress: { type: 'string', unique: true, ethereumAddress: true },

    contribution: { type: 'float', min: 0 }

  },

  types: {
    phoneNumber: value => ValidationService.phoneNumber(value),
    ethereumAddress: value => ValidationService.ethereumAddress(value),
    bitcoinAddress: value => ValidationService.bitcoinAddress(value),
    postalCode: value => ValidationService.postalCode(value)
  },

  validationMessages: {
    email: {
      required: 'Email is required',
      email: 'Provide valid email',
      unique: 'Email is already taken'
    },
    firstName: {
      required: 'First name is required',
      alpha: 'Provide valid first name'
    },
    lastName: {
      required: 'Last name is required',
      alpha: 'Provide valid last name'
    },
    nationality: {
      required: 'Nationality is required',
      in: 'Provide valid nationality'
    },
    receivingEthereumAddress: {
      ethereumAddress: 'Provide valid receiving ethereum address',
      unique: 'Receiving ethereum address is already taken'
    },
    contribution: {
      type: 'Provide valid contribution number',
      min: 'Provide valid contribution number'
    }
  },

  indexes: [
    {
      attributes: { email: 1 },
      options: { unique: true }
    }, {
      attributes: { receivingEthereumAddress: 1 },
      options: {
        unique: true,
        partialFilterExpression: {receivingEthereumAddress: {$exists: true}}
      }
    }
  ]
};
