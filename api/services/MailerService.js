/* globals sails */

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(sails.config.sendgridApiKey);

function sendEmail ({to, subject, html}) {
  const msg = {
    to: to,
    from: 'kora@no-reply.com',
    subject: subject || 'Sample subject',
    html: html || '<h1>sample html</h1>'
  };
  return sgMail.send(msg);
}

function sendConfirmationEmail (user) {
  return sendEmail({
    to: user.email,
    subject: 'Kora email confirmation instructions',
    html: `<p>To confirm your email click the <a href="${sails.config.HOST}/api/profile/confirmEmail/${user.emailVerificationToken}">link</a></p>`
  });
}

function sendAuthenticatorRecoveryEmail (user, {key, qrcode}) {
  return sendEmail({
    to: user.email,
    subject: 'Kora new Google Authenticator secret seed',
    html: `<p>Your new Google Authenticator secret seed: ${key}<br/><div><img src="${qrcode}" alt="QR Code"></div></p>`
  });
}

const mailer = {
  sendConfirmationEmail,
  sendAuthenticatorRecoveryEmail
};

module.exports = mailer;
