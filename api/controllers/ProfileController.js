/**
 * ProfileController
 *
 * @description :: Server-side logic for managing profiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global sails _ User CountriesService ErrorService MiscService MailerService AddressHistory AuthenticatorService Sessions */

const updateAttrs = ['email', 'sendingEthereumAddress', 'bitcoinAddress'];

const needVerifyNames = {
  'firstName': 'First Name',
  'lastName': 'Last Name',
  'phone': 'Phone Number',
  'country': 'Country',
  'dateOfBirth': 'Birthday',
  'streetAddress': 'Street Address',
  'city': 'City',
  'state': 'State',
  'zip': 'Zip',
  'identificationType': 'Identification Type',
  'documentCountry': 'Document Country'
};
const needVerifyAttrs = Object.keys(needVerifyNames);

module.exports = {

  /**
   * `ProfileController.index()`
   */
  index: function (req, res) {
    const user = req.user;

    switch (req.method) {
      case 'GET':
        return res.json(user);

      case 'PUT':
        let allParams = _.pick(req.allParams(), updateAttrs);

        // if (!allParams.token) {
        //   return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
        // }

        // if (!AuthenticatorService.verify(req.user.twoFactorSecret, allParams.token)) {
        //   return res.badRequest({
        //     message: 'Google Authenticator Code is expired or invalid'
        //   });
        // }

        allParams = Object.keys(allParams).reduce((result, el) => {
          result[el] = (el === 'bitcoinAddress') ? allParams[el] : allParams[el].toLowerCase();
          return result;
        }, {});

        allParams = _.pick(allParams, (value, key) => (user[key] !== value));

        if (_.isEmpty(allParams)) {
          return res.badRequest({
            message: 'Nothing was changed'
          });
        }

        let oldParams = _.pick(user, Object.keys(allParams));

        return User.update({id: user.id}, allParams)
          .then(([user]) => {
            req.user = user;

            // AddressHistory saving
            if (AddressHistory.constants.typesList.some(type => oldParams[type])) {
              let promises = [];

              AddressHistory.constants.typesList.forEach(type => {
                if (oldParams[type]) {
                  promises.push(AddressHistory.create({type, user: user.id, address: oldParams[type]}));
                }
              });

              Promise.all(promises).catch(err => sails.log.error(err));
            }

            return user;
          })
          .then(result => res.ok(result))
          .catch(err => res.negotiate(err));

      default:
        return res.send(405, {message: 'method not allowed'});
    }
  },

  verify: function (req, res) {
    if (req.user.verified) {
      return res.badRequest({ message: 'User has already verified id' });
    }

    let allParams = _.pick(req.allParams(), ['aptSte'].concat(needVerifyAttrs));

    let notFilledAttr = needVerifyAttrs.find(key => !allParams[key]);

    if (notFilledAttr) {
      return res.badRequest({
        message: `Field ${needVerifyNames[notFilledAttr]} must be filled`
      });
    }

    allParams.hasVerifyInfo = true; // For admin verification

    return User.update({id: req.user.id}, allParams)
      .then(([user]) => {
        req.user = user;

        return user;
      })
      .then(result => res.ok(result))
      .catch(err => res.negotiate(err));
  },

  selects: function (req, res) {
    return res.ok({
      identificationType: User.constants.identificationTypesSelect,
      country: CountriesService.list
    });
  },

  confirmEmail: function (req, res) {
    const token = req.param('token');

    User.findOne({emailVerificationToken: token})
      .then(user => {
        if (!user) {
          return Promise.reject(ErrorService.new({message: 'Email confirmation link is invalid', status: 404}));
        }

        return User.update({id: user.id}, {emailVerified: true, emailVerificationToken: null});
      })
      .then(result => res.redirect('/#/?emailVerified'))
      .catch(err => {
        sails.log.error(err);
        return res.redirect('/#/?emailUnverified');
      });
  },

  // POST /api/profile/forgotPassword
  forgotPassword: function (req, res) {
    const email = req.param('email');

    User.findOne({email})
      .then(user => {
        if (!user) {
          return Promise.resolve();
        }

        return User.update({id: user.id}, {resetPasswordToken: MiscService.generateRandomString(50)})
          .then(updatedUsers => {
            MailerService.sendResetPwEmail(updatedUsers[0]);
          });
      })
      .then(() => {
        res.ok({ message: 'Forgot password request has been successfully sent to registered email.' });
      })
      .catch(err => res.negotiate(err));
  },

  // PUT /api/profile/restorePassword
  restorePassword: function (req, res) {
    const resetPasswordToken = req.param('token');
    const password = req.param('new_password');

    // if (!password) res.badRequest({ message: 'No password provided' });

    User.findOne({resetPasswordToken})
      .then(user => {
        if (!user) {
          return Promise.reject(ErrorService.new({message: 'Forgot password request is expired. Please create a new forgot password request', status: 404}));
        }

        return User.update({id: user.id}, { password, resetPasswordToken: '' })
          .then(() => Sessions.destroy({session: {contains: user.id}}));
      })
      .then(() => res.ok({ message: 'Password has been successfully restored' }))
      .catch(err => res.negotiate(err));
  },

  confirm: function (req, res) {
    const token = req.param('token');
    const password = req.param('password');
    const code = req.param('code');

    if (!token) {
      return res.badRequest({ message: 'Token can not be empty' });
    }

    if (!password) {
      return res.badRequest({ message: 'Password can not be empty' });
    }

    if (!code) {
      return res.badRequest({ message: 'Google Authenticator Code can not be empty' });
    }

    User.findOne({emailVerificationToken: token})
      .exec((err, user) => {
        if (err) {
          return res.negotiate(err);
        }

        if (!user) {
          return res.notFound({message: 'No user with such token found'});
        }

        if (!AuthenticatorService.verify(user.twoFactorSecret, code)) {
          return res.badRequest({
            message: 'Google Authenticator Code is expired or invalid'
          });
        }

        return User.update({id: user.id}, {password, emailVerified: true, emailVerificationToken: null})
          .then(records => res.ok(records[0]))
          .catch(err => res.negotiate(err));
      });
  }
};
