/* globals MailerService */

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(sails.config.sendgridApiKey);

function sendEmail({to, subject, html}) {
  const msg = {
    to: to,
    from: 'kora@no-reply.com',
    subject: subject || 'Sample subject',
    html: html || '<h1>sample html</h1>',
  };
  return sgMail.send(msg);
}

function sendConfirmationEmail(user) {

  return sendEmail({
    to: user.email,
    subject: 'Kora email confirmation instructions',
    html: `<p>To confirm your email click the <a href="${sails.config.HOST}/api/users/confirmEmail/${user.emailVerificationToken}">link</a></p>`
  })
}

const mailer = {
  sendConfirmationEmail
};

module.exports = mailer;
