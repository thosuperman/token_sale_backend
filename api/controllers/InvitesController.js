/**
 * InvitesController
 *
 * @description :: Server-side logic for managing invites
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global Invites User */

module.exports = {
  create: function (req, res) {
    const email = req.param('email').toLowerCase();

    User.findOne({email})
      .exec((err, user) => {
        if (err) {
          return res.negotiate(err);
        }

        if (user) {
          return res.badRequest({message: 'User with such email already registered'});
        }

        Invites.destroy({email})
          .then(() => Invites.create({email}))
          .then(invite => res.created(invite))
          .catch(err => res.negotiate(err));
      });
  }
};
