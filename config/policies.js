/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */

module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  // '*': true,

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
  // RabbitController: {

    // Apply the `false` policy as the default for all of RabbitController's actions
    // (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
    // '*': false,

    // For the action `nurture`, apply the 'isRabbitMother' policy
    // (this overrides `false` above)
    // nurture: 'isRabbitMother',

    // Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
    // before letting any users feed our rabbits
    // feed: ['isNiceToAnimals', 'hasRabbitFood']
  // }

  '*': ['isAuthorized'],

  UserController: {
    find: ['isAdmin'],
    findOne: ['isAdmin'],
    update: ['isAdmin'],
    verify: ['isAdmin'],
    blockChange: ['isAdmin'],
    create: ['isAdmin'],
    '*': ['deny']
    // destroy: false
  },

  CountriesController: {
    '*': true
  },

  RegistrationController: {
    '*': true
  },

  ProfileController: {
    '*': ['isAuthorized'],
    confirmEmail: true,
    forgotPassword: true,
    restorePassword: true,
    confirm: true
  },

  AuthController: {
    '*': ['isAuthorized'],
    login: true
  },

  TransactionsController: {
    find: ['isAuthorized'],
    findAll: ['isAdmin'],
    filters: ['isAdmin'],
    allocate: ['isAdmin'],
    findAllocate: ['isAdmin'],
    '*': false
  },

  TestController: {
    '*': true
  },

  TotalAmountController: {
    find: ['isAdmin'],
    '*': false
  },

  AuthenticatorRecoveryController: {
    '*': false,
    update: true,
    find: ['isAdmin'],
    findOne: ['isAdmin'],
    reset: ['isAdmin'],
    destroy: ['isAdmin']
  },

  FilesController: {
    findOne: ['isAuthorized'],
    '*': ['deny']
  },

  SaleController: {
    findLast: ['isAdmin'],
    create: ['isAdmin'],
    switchToPublicSale: ['isAdmin'],
    '*': ['deny']
  },

  ManageTokensController: {
    '*': ['isAdmin']
  },

  AddressHistoryController: {
    index: ['isAuthorized'],
    '*': ['deny']
  },

  AdminController: {
    '*': ['isAdmin']
  },

  OnfidoController: {
    '*': ['isAuthorized'],
    report: ['isAdmin']
  },

  InvitesController: {
    '*': ['isAdmin']
  }
};
