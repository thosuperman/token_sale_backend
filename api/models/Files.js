/**
 * Files.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    fd: { type: 'string', required: true },

    size: { type: 'integer', required: true },

    type: { type: 'string', required: true },

    filename: { type: 'string', required: true }
  }
};
