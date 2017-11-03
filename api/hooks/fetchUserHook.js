/**
 * fetchUserHook
 * @description :: Adds user to req if there are userId in session
 * @return {[type]}       [description]
 */

/* global User */

module.exports = function sessionTokenHook (sails) {
  return {
    // Add some routes to the app.
    routes: {

      // Add these routes _before_ anything defined in `config/routes.js`.
      before: {

        // Add a route that will match everything (using skipAssets to...skip assets!)
        '/*': {
          fn: function (req, res, next) {
            const userId = req.session.userId;

            if (!userId) {
              return next();
            }

            User.findOne({id: userId}).exec(function (err, user) {
              if (err) {
                return res.negotiate(err);
              }

              if (!user) {
                sails.log.warn('Could not find user in session with id', userId);
                delete req.session.userId;

                return next();
              }

              req.user = user;

              return next();
            });
          },

          skipAssets: true
        }
      }
    }
  };
};
