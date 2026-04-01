const layout = (title, headerColor, content, ctaLink = null, ctaText = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .header {
      background-color: ${headerColor || '#3b82f6'};
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .content h2 {
      color: #0f172a;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .highlight {
      display: block;
      background-color: #f1f5f9;
      padding: 15px 20px;
      border-radius: 8px;
      border-left: 4px solid ${headerColor || '#3b82f6'};
      margin-bottom: 25px;
      font-weight: 500;
      color: #0f172a;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: ${headerColor || '#3b82f6'};
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .header, .content, .footer { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${content}
        ${ctaLink ? `
        <div class="cta-container">
          <a href="${ctaLink}" class="cta-button">${ctaText || 'View Details'}</a>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p><strong>Reunite</strong> • Federal University Dutse</p>
        <p>Connecting lost items with their rightful owners.</p>
        <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Reunite. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  // OTP email notification
  otpTemplate: (name, itemTitle, otp) => layout(
    'Reunite - OTP Verification',
    '#3b82f6', // Blue
    `
      <h2>Hello ${name},</h2>
      <p>An OTP has been generated for claiming your item titled "<strong>${itemTitle}</strong>".</p>
      <div class="highlight" style="font-size: 18px; text-align: center;">
        Your OTP is: <strong style="color: #3b82f6; font-size: 24px; letter-spacing: 2px;">${otp}</strong>
      </div>
      <p>Please use this OTP to verify the claim within <strong>10 minutes</strong>.</p>
      <p style="font-size: 14px; color: #64748b;">If you did not request this, please contact support immediately.</p>
    `
  ),

  // Claim notification email 
  claimNotificationTemplate: (name, itemTitle) => layout(
    'Update on Your Item',
    '#6366f1', // Indigo
    `
      <h2>Hello ${name},</h2>
      <p>There has been an update regarding your item "<strong>${itemTitle}</strong>".</p>
      <div class="highlight">
        Someone has initiated a claim for this item.
      </div>
      <p>Thank you for using our service! You will be notified as the transaction progresses and is finalized.</p>
    `
  ),

  // Return notification email
  returnNotificationTemplate: (name, itemTitle) => layout(
    'Item Successfully Returned!',
    '#10b981', // Emerald
    `
      <h2>Hello ${name},</h2>
      <p>Fantastic news! The item "<strong>${itemTitle}</strong>" has been officially marked as returned.</p>
      <div class="highlight" style="border-left-color: #10b981;">
        The handoff was successful and the system records have been updated.
      </div>
      <p>Thank you for using Reunite for your lost and found needs!</p>
    `
  ),

  // Keeper assignment notification email
  keeperAssignedNotificationTemplate: (name, itemTitle, keeperName) => layout(
    'Keeper Assigned to Your Item',
    '#8b5cf6', // Violet
    `
      <h2>Hello ${name},</h2>
      <p>Good news! A verified keeper has been assigned to help facilitate the return of your item.</p>
      <div class="highlight" style="border-left-color: #8b5cf6;">
        <p style="margin-bottom: 5px; font-size: 14px; color: #64748b;">Assigned Keeper:</p>
        <strong>${keeperName}</strong> is now managing "<strong>${itemTitle}</strong>".
      </div>
      <p>They will securely hold the item and verify any claims. Feel free to contact them if you have further details to share.</p>
    `
  ),

  // Password reset OTP email
  passwordResetOtpTemplate: (name, otp) => layout(
    'Password Reset Request',
    '#ef4444', // Red
    `
      <h2>Hello ${name},</h2>
      <p>We received a request to reset your password for your Reunite account.</p>
      <div class="highlight" style="border-left-color: #ef4444; font-size: 18px; text-align: center;">
        Your Reset OTP: <strong style="color: #ef4444; font-size: 24px; letter-spacing: 2px;">${otp}</strong>
      </div>
      <p>Please use this OTP to securely reset your password within <strong>10 minutes</strong>.</p>
      <p style="font-size: 14px; color: #64748b;">If you did not request this password reset, please ignore this email. Your account remains secure.</p>
    `
  ),

  // Claim transaction verification email
  claimTransactionTemplate: (name, itemTitle, ownerName) => layout(
    'Claim Transaction Instruction',
    '#f59e0b', // Amber
    `
      <h2>Hello ${name},</h2>
      <p>You're almost there! To complete the transaction for "<strong>${itemTitle}</strong>", please arrange a meeting.</p>
      <div class="highlight" style="border-left-color: #f59e0b; text-align: center;">
        <p style="margin-bottom: 5px; font-size: 14px; color: #64748b;">Handoff Required</p>
      </div>
      <p>Please meet with <strong>${ownerName}</strong> (or the assigned keeper) in person to finalize the return.</p>
    `
  ),

  // Smart match notification email
  matchFoundTemplate: (name, itemTitle, matchPercentage, viewLink, actionText, keeperName = null) => layout(
    'Smart Match Found!',
    '#0ea5e9', // Sky
    `
      <h2>Great news, ${name}!</h2>
      <p>Our AI system has found a potential match for your item "<strong>${itemTitle}</strong>".</p>
      
      <div class="highlight" style="border-left-color: #0ea5e9; display: flex; align-items: center; gap: 15px;">
        <div style="background: #0ea5e9; color: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; line-height: 50px; text-align: center; padding: 5px;">
          ${matchPercentage}%
        </div>
        <div style="padding-top: 15px;">
           <strong>Match Confidence</strong><br>
           <span style="font-size: 14px; color: #64748b;">Based on description analysis</span>
        </div>
      </div>
      
      ${keeperName ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 15px;">To proceed, please coordinate with the authorized Keeper assigned to this item: <strong>${keeperName}</strong>.</p>
      </div>
      ` : ''}

      <p style="font-size: 14px; color: #64748b; background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 6px;">
        <strong>Safety Reminder:</strong> Always meet in a safe, public location on campus and thoroughly verify the item before completing any exchange.
      </p>
    `,
    viewLink,
    actionText
  ),

  // Account verification OTP email during registration
  accountVerificationOtpTemplate: (name, otp) => layout(
    'Welcome to Reunite!',
    '#3b82f6', // Blue
    `
      <h2>Hello ${name},</h2>
      <p>Thank you for joining Reunite, the premier lost and found network for Federal University Dutse.</p>
      <div class="highlight" style="text-align: center;">
        <p style="margin-bottom: 5px; font-size: 14px; color: #64748b;">Your Verification OTP:</p>
        <strong style="color: #3b82f6; font-size: 24px; letter-spacing: 2px;">${otp}</strong>
      </div>
      <p>Please use this code to activate your account within <strong>10 minutes</strong>.</p>
    `
  ),

  // Template sent to keeper/admin when a claim request needs their approval
  claimPendingApprovalTemplate: (keeperName, claimantName, itemTitle, itemLink) => layout(
    'Action Required: Claim Request',
    '#f97316', // Orange
    `
      <h2>Hello ${keeperName},</h2>
      <p>Action is required on an item you are managing.</p>
      <div class="highlight" style="border-left-color: #f97316;">
        <strong>${claimantName}</strong> has requested to claim the item:
        <br> "<strong>${itemTitle}</strong>"
      </div>
      <p>Please review the request and approve or reject it from your dashboard.</p>
    `,
    itemLink,
    'Review Claim Request'
  ),

  // Template sent to claimant when keeper/admin approves their claim
  claimApprovedTemplate: (claimantName, itemTitle, itemLink) => layout(
    'Claim Approved!',
    '#10b981', // Emerald
    `
      <h2>Congratulations ${claimantName},</h2>
      <p>Your claim request for "<strong>${itemTitle}</strong>" has been officially <strong style="color: #10b981;">approved</strong> by the administrator/keeper.</p>
      <div class="highlight" style="border-left-color: #10b981;">
        <p style="margin: 0;">Please contact the keeper to arrange a meeting when you are ready to collect your item.</p>
      </div>
      <p>Proceed to your dashboard to view the item and coordinate the handoff!</p>
    `,
    itemLink,
    'View Item Details'
  ),
};