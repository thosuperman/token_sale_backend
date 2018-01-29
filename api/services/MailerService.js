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

function sendResetPwEmail (user) {
  return sendEmail({
    to: user.email,
    subject: 'You have requested password restoration at Kora',
    html: `<p>Please, follow the <a href="${sails.config.HOST}/#/restore_password/${user.resetPasswordToken}">link</a> to restore your password</p>`
  });
}

function sendCreateAdminEmail (user, {key, qrcode}) {
  return sendEmail({
    to: user.email,
    subject: 'Kora admin account confirmation instructions',
    html: `<p>To confirm your admin account and enter password click the <a href="${sails.config.HOST}/admin/#/create_password/${user.emailVerificationToken}">link</a></p>
          <p>Your Google Authenticator secret seed: ${key}<br/><div><img src="${qrcode}" alt="QR Code"></div></p>`
  });
}

function sendCreateUserEmail (user, {key, qrcode}) {
  return sendEmail({
    to: user.email,
    subject: 'Kora account confirmation instructions',
    html: `<p>To confirm your account and enter password click the <a href="${sails.config.HOST}/#/create_password/${user.emailVerificationToken}">link</a></p>
          <p>Your Google Authenticator secret seed: ${key}<br/><div><img src="${qrcode}" alt="QR Code"></div></p>`
  });
}

function sendInviteUSEmail ({token, email}) {
  return sendEmail({
    to: email,
    subject: 'You have requested registration invite from Kora',
    html: `<p>Please, follow the <a href="${sails.config.HOST}/#/register/${token}?email=${email}">link</a> to register at Kora token sale</p>`
  });
}

const mailer = {
  sendConfirmationEmail,
  sendAuthenticatorRecoveryEmail,
  sendResetPwEmail,
  sendCreateAdminEmail,
  sendCreateUserEmail,
  sendInviteUSEmail
};

module.exports = mailer;
