/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

/* global sails */

const schedule = require('node-schedule');

module.exports.bootstrap = function (cb) {
  // Option for req.ip
  sails.hooks.http.app.set('trust proxy', true);

  if (process.env.NODE_APP_INSTANCE === 0) {
    let j = schedule.scheduleJob('*/5 * * * * *', function () {
      sails.log.info(`[${process.env.NODE_APP_INSTANCE}]:`, 'The answer to life, the universe, and everything!');
    });
  }

  let j2 = schedule.scheduleJob('*/7 * * * * *', function () {
    sails.log.info(`[${process.env.NODE_APP_INSTANCE}]:`, 'The answer to life, the universe, and everything!');
  });


  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
