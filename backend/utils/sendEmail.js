const nodemailer = require('nodemailer');
const he = require('he');
const {
  otpTemplate,
  claimNotificationTemplate,
  returnNotificationTemplate,
  keeperAssignedNotificationTemplate,
  passwordResetOtpTemplate,
  claimTransactionTemplate,
  accountVerificationOtpTemplate, // Added new template
} = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error.message);
  } else {
    console.log('Email transporter is ready');
  }
});

const sendEmail = async (to, subject, templateName, templateData) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email credentials are missing. Please set EMAIL_USER and EMAIL_PASSWORD in the .env file.');
  }

  // Escape all string values in templateData to prevent HTML injection
  const escapedTemplateData = {};
  if (templateData && typeof templateData === 'object') {
    for (const key in templateData) {
      if (Object.prototype.hasOwnProperty.call(templateData, key)) {
        const value = templateData[key];
        escapedTemplateData[key] = typeof value === 'string' ? he.encode(value) : value;
      }
    }
  }

  try {
    let html;
    switch (templateName) {
      case 'otp':
        html = otpTemplate(escapedTemplateData.name, escapedTemplateData.itemTitle, escapedTemplateData.otp);
        break;
      case 'claimNotification':
        html = claimNotificationTemplate(escapedTemplateData.name, escapedTemplateData.itemTitle);
        break;
      case 'returnNotification':
        html = returnNotificationTemplate(escapedTemplateData.name, escapedTemplateData.itemTitle);
        break;
      case 'keeperAssignedNotification':
        html = keeperAssignedNotificationTemplate(escapedTemplateData.name, escapedTemplateData.itemTitle, escapedTemplateData.keeperName);
        break;
      case 'passwordResetOtp':
        html = passwordResetOtpTemplate(escapedTemplateData.name, escapedTemplateData.otp);
        break;
      case 'claimTransaction':
        html = claimTransactionTemplate(escapedTemplateData.name, escapedTemplateData.itemTitle, escapedTemplateData.otp, escapedTemplateData.ownerName);
        break;
      case 'accountVerificationOtp':
        html = accountVerificationOtpTemplate(escapedTemplateData.name, escapedTemplateData.otp);
        break;
      default:
        throw new Error('Invalid email template name');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} with template ${templateName}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.message.includes('Missing credentials')) {
      throw new Error('Failed to send email: Missing or invalid credentials. Check EMAIL_USER and EMAIL_PASSWORD in .env.');
    }
    throw new Error('Failed to send email: ' + error.message);
  }
};

module.exports = sendEmail;