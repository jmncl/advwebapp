require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 2525;
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Check SMTP_HOST, SMTP_EMAIL, and SMTP_PASSWORD in .env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass }
  });

  const message = {
    from: `${process.env.SMTP_FROM_NAME || 'Jordan Brand Store'} <${process.env.SMTP_FROM_EMAIL || 'noreply@jordanstore.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || `<p>${options.message}</p>`,
    attachments: options.attachments || []
  };

  const info = await transporter.sendMail(message);
  console.log(`Email sent to ${options.email} (messageId: ${info.messageId})`);
  return info;
};

module.exports = sendEmail;
