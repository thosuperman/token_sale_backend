/**
 * InvitesController
 *
 * @description :: Server-side logic for managing invites
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Invites User _ ValidationService */

module.exports = {
  create: function (req, res) {
    const email = req.param('email').toLowerCase();

    let emailList = _.map(email.split(','), _.trim);

    let notValidEmails = emailList.filter(email => !ValidationService.email(email));

    if (notValidEmails.length) {
      return res.badRequest({
        message: `There are not valid emails: ${notValidEmails.join(', ')}.`,
        emails: notValidEmails
      });
    }

    User.find({email: emailList})
      .exec((err, users) => {
        if (err) {
          return res.negotiate(err);
        }

        if (users.length) {
          let registeredEmails = users.map(({email}) => email);

          return res.badRequest({
            message: `Users with such emails already registered: ${registeredEmails.join(', ')}.`,
            emails: registeredEmails
          });
        }

        Invites.destroy({email: emailList})
          .then(() => Invites.create(emailList.map(email => ({email}))))
          .then(invites => res.created(invites))
          .catch(err => res.negotiate(err));
      });
  }
};
