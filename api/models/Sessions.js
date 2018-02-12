/**
 * Sessions.js
 *
 * @description :: Sessions model for destroy session for blocked users.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    session: { type: 'string' },

    expires: { type: 'date' }
  }
};
