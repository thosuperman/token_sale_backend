/**
 * optionsHook
 * @description :: Returns allowed http methods on OPTIONS request
 * @return {[type]}       [description]
 */

const allowedMethods = 'DELETE,GET,HEAD,POST,PUT';

module.exports = function sessionTokenHook (sails) {
  return {
    routes: {
      before: {
        'OPTIONS /*': {
          fn: function (req, res, next) {
            res.set('Allow', allowedMethods);
            res.ok(allowedMethods);
          },

          skipAssets: true
        }
      }
    }
  };
};
