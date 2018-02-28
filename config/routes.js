/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

// /* global sails */

const {blueprints} = require('./blueprints');
const prefix = blueprints.prefix || '';

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  // '/': {
  //   view: 'homepage',
  //   locals: {
  //     title: 'Kora ICO'
  //   }
  // }

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

  [`GET ${prefix}/countries`]: {controller: 'CountriesController', action: 'index'},
  [`GET ${prefix}/countries/collection`]: {controller: 'CountriesController', action: 'collection'},

  [`GET ${prefix}/registration/checkInviteToken`]: {controller: 'RegistrationController', action: 'checkInviteToken'},
  [`${prefix}/registration/checkUserInfo`]: {controller: 'RegistrationController', action: 'checkUserInfo'},
  [`PUT ${prefix}/registration/isRegisteredMVPUser`]: {controller: 'RegistrationController', action: 'isRegisteredMVPUser'},
  // [`PUT ${prefix}/registration/sendMVPCode`]: {controller: 'RegistrationController', action: 'sendMVPCode'},
  // [`PUT ${prefix}/registration/verifyMVPCode`]: {controller: 'RegistrationController', action: 'verifyMVPCode'},
  [`PUT ${prefix}/registration/disableMVPCheck`]: {controller: 'RegistrationController', action: 'disableMVPCheck'},
  [`PUT ${prefix}/registration/validateCaptcha`]: {controller: 'RegistrationController', action: 'validateCaptcha'},
  [`PUT ${prefix}/registration/checkIp`]: {controller: 'RegistrationController', action: 'checkIp'},
  [`PUT ${prefix}/registration/generateQRCode`]: {controller: 'RegistrationController', action: 'generateQRCode'},
  [`POST ${prefix}/registration/confirm`]: {controller: 'RegistrationController', action: 'confirm'},

  [`POST ${prefix}/auth/login`]: {controller: 'AuthController', action: 'login'},
  [`DELETE ${prefix}/auth/logout`]: {controller: 'AuthController', action: 'logout'},

  [`${prefix}/profile`]: {controller: 'ProfileController', action: 'index'},
  [`PUT ${prefix}/profile/verify`]: {controller: 'ProfileController', action: 'verify'},
  [`GET ${prefix}/profile/selects`]: {controller: 'ProfileController', action: 'selects'},
  [`GET ${prefix}/profile/confirmEmail/:token`]: {controller: 'ProfileController', action: 'confirmEmail'},
  [`POST ${prefix}/profile/forgotPassword`]: {controller: 'ProfileController', action: 'forgotPassword'},
  [`PUT ${prefix}/profile/restorePassword/:token`]: {controller: 'ProfileController', action: 'restorePassword'},
  [`PUT ${prefix}/profile/confirm`]: {controller: 'ProfileController', action: 'confirm'},

  [`GET ${prefix}/values`]: {controller: 'ValuesController', action: 'index'},

  [`PUT ${prefix}/password/change`]: {controller: 'PasswordController', action: 'change'},

  [`PUT ${prefix}/authenticator/regenerate`]: {controller: 'AuthenticatorController', action: 'regenerate'},
  [`PUT ${prefix}/authenticator/reEnable`]: {controller: 'AuthenticatorController', action: 'reEnable'},

  [`POST ${prefix}/authenticator/recovery`]: {model: 'authenticatorrecovery', blueprint: 'create'},
  [`PUT ${prefix}/authenticator/recovery/:id`]: {controller: 'AuthenticatorRecoveryController', action: 'update'},

  [`GET ${prefix}/transactions`]: {controller: 'TransactionsController', action: 'find'},
  [`GET ${prefix}/transactions/findAll`]: {controller: 'TransactionsController', action: 'findAll'},
  [`GET ${prefix}/transactions/filters`]: {controller: 'TransactionsController', action: 'filters'},

  [`GET ${prefix}/users`]: {controller: 'UserController', action: 'find'},
  [`GET ${prefix}/users/:id`]: {controller: 'UserController', action: 'findOne'},
  [`PUT ${prefix}/users/verify/:id`]: {controller: 'UserController', action: 'verify'},
  [`PUT ${prefix}/users/blockChange/:id`]: {controller: 'UserController', action: 'blockChange'},
  [`PUT ${prefix}/users/:id`]: {controller: 'UserController', action: 'update'},
  [`PUT ${prefix}/users/allocate/:id`]: {controller: 'TransactionsController', action: 'allocate'},
  [`GET ${prefix}/users/allocate/:id`]: {controller: 'TransactionsController', action: 'findAllocate'},
  [`POST ${prefix}/users/inviteUS`]: {controller: 'InvitesController', action: 'create'},
  [`POST ${prefix}/users`]: {controller: 'UserController', action: 'create'},

  [`POST ${prefix}/admin`]: {controller: 'AdminController', action: 'create'},
  [`PUT ${prefix}/admin/confirm`]: {controller: 'ProfileController', action: 'confirm'},
  [`PUT ${prefix}/admin/profile`]: {controller: 'AdminController', action: 'update'},

  [`GET ${prefix}/manageTokens`]: {controller: 'ManageTokensController', action: 'index'},
  [`POST ${prefix}/manageTokens/sale`]: {controller: 'SaleController', action: 'create'},
  [`POST ${prefix}/manageTokens/switchToPublicSale`]: {controller: 'SaleController', action: 'switchToPublicSale'},
  [`GET ${prefix}/sale`]: {controller: 'SaleController', action: 'findLast'},

  [`GET ${prefix}/authenticatorRecovery`]: {controller: 'AuthenticatorRecoveryController', action: 'find'},
  [`GET ${prefix}/authenticatorRecovery/:id`]: {controller: 'AuthenticatorRecoveryController', action: 'findOne'},
  [`POST ${prefix}/authenticatorRecovery/:id`]: {controller: 'AuthenticatorRecoveryController', action: 'reset'},
  [`DELETE ${prefix}/authenticatorRecovery/:id`]: {controller: 'AuthenticatorRecoveryController', action: 'destroy'},

  [`GET ${prefix}/addressHistory`]: {controller: 'AddressHistory', action: 'index'},

  [`POST ${prefix}/onfido/sdkToken`]: {controller: 'OnfidoController', action: 'sdkToken'},
  [`POST ${prefix}/onfido/createCheck`]: {controller: 'OnfidoController', action: 'createCheck'},
  [`GET ${prefix}/onfido/document/:id`]: {controller: 'OnfidoController', action: 'document'},
  [`GET ${prefix}/onfido/report/:id`]: {controller: 'OnfidoController', action: 'report'},

  [`POST ${prefix}/whitelist`]: {model: 'whitelist', blueprint: 'create'},
  [`GET ${prefix}/whitelist`]: {controller: 'WhitelistController', action: 'find', policy: 'isAdmin'},
  [`GET ${prefix}/whitelist/:id`]: {model: 'whitelist', blueprint: 'findOne', policy: 'isAdmin'}

  // [`${prefix}/custom`]: {controller: 'User', action: 'find'},
  // '/routes': (req, res) => res.ok(sails.config.routes)
};
