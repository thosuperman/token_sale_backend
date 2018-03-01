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
    subject: 'Verify Your Email on Kora',
    html: `
<div>
<img src="${sails.config.HOST}/logo.png" alt="logo" width="100" />
<p>Hi,</p>
<p>Thanks for signing up on Kora’s Token Sale portal. </p>
<p>In order to complete KYC and contribute to the Token Sale, please verify your email:</p>
<p><a href="${sails.config.HOST}/api/profile/confirmEmail/${user.emailVerificationToken}">${sails.config.HOST}/api/profile/confirmEmail/${user.emailVerificationToken}</a></p>
<p>Thanks, <br/> - The Team at Kora </p>
</div>
`
  });
}

function sendKYCSubmissionReceivedEmail (user) {
  return sendEmail({
    to: user.email,
    subject: 'KYC Submission Received',
    html: `
<div>
<img src="${sails.config.HOST}/logo.png" alt="logo" width="100" />
<p>Hi,</p>
<p>Thanks for your submitting your identity for verification. As we use a third-party provider, it can take up to 3-5 business days to process and confirm your submission.</p>
<p>You will receive a confirmation once it has been verified. We appreciate your patience.</p>
<p>If you have any questions, please write to us at <a href="mailto:info@kora.network">info@kora.network</a></p>
<p>Thanks, <br/> - The Team at Kora </p>
<p>Note: You will not be able to contribute till your identity has been verified.</p>
</div>
`
  });
}

function sendKYCApprovedEmail (user) {
  return sendEmail({
    to: user.email,
    subject: 'KYC Approved',
    html: `
<div>
<img src="${sails.config.HOST}/logo.png" alt="logo" width="100" />
<p>Hi,</p>
<p>You can now contribute to the Kora Token Sale! Instructions on how to contribute will be released on all our channels so please stay tuned.</p>
<p>If you have any questions, please write to us at <a href="mailto:info@kora.network">info@kora.network</a></p>
<p>Thanks, <br/> - The Team at Kora </p>
</div>
`
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
    subject: 'Kora Pre-Sale Registration & Contribution',
    html: `
<div>
<img src="${sails.config.HOST}/logo.png" alt="logo" width="100" />
<p>Hi there,</p>
<p>You have been invited in this batch of people who signed up for the Whitelist, so we are excited to share the link for the Token Sale Portal with you.</p>
<p><b>When can you register and contribute?</b></p>
<p>Anytime from now till the sale closes!</p>
<p><b>Do I need to rush?</b></p>
<p>It's first come, first serve. Remember, the minimum is $5000 and there are no limits at the Pre-sale stage.</p>
<p><b>How do I participate?</b></p>
<p>
<ul>
<li>Go to <a href="${sails.config.HOST}/#/register/${token}?email=${email}">our portal</a></li>
<li>Follow the necessary procedure to register via the above link. Please ensure you submit your ID for verification as without this process you cannot contribute.</li>
<li>Verification does not take long, but may take 3-5 business days in some cases. Please check back on the portal frequently to know your verification status.</li>
<li>Once you have been verified, you can now click on the ETH or BTC icon to see our address and send funds.</li>
</ul>
</p>
<p>Happy Contribution!</p>
<p>Thanks,<br/>  -  The Team at Kora</p>
</div>
`
  });
}

const mailer = {
  sendConfirmationEmail,
  sendAuthenticatorRecoveryEmail,
  sendResetPwEmail,
  sendCreateAdminEmail,
  sendCreateUserEmail,
  sendInviteUSEmail,
  sendKYCSubmissionReceivedEmail,
  sendKYCApprovedEmail
};

module.exports = mailer;
