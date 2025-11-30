import axios from 'axios';
import logger from '../utils/logger.js';

// Read environment variables dynamically to ensure they're loaded
const getResendApiKey = () => process.env.RESEND_API_KEY;
const getDefaultFrom = () => process.env.EMAIL_FROM || 'onboarding@resend.dev';
const getDefaultTo = () => process.env.ORDER_NOTIFY_EMAIL || 'cudliy123@gmail.com';

function buildOrderEmailHtml({ order, designImageUrl }) {
  const item = order?.items?.[0] || {};
  const size = item?.attributes?.size || 'N/A';
  const qty = item?.quantity || 1;
  const title = item?.designTitle || 'Custom 3D Design';
  const total = order?.pricing?.total ?? 0;
  const currency = (order?.pricing?.currency || 'USD').toUpperCase();
  const shippingName = [order?.shipping?.firstName, order?.shipping?.lastName].filter(Boolean).join(' ');
  const shippingEmail = order?.shipping?.email || order?.billing?.email || '';
  const shippingAddress = order?.shipping?.address || {};

  return `
  <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.5; color:#111;">
    <h2>New Paid Order Received</h2>
    <p>A Stripe checkout has completed successfully.</p>
    <h3 style="margin-bottom:4px;">Order Summary</h3>
    <ul style="margin-top:4px;">
      <li><strong>Order ID:</strong> ${order?.id || ''}</li>
      <li><strong>Stripe Session:</strong> ${order?.stripeSessionId || order?.payment?.transactionId || ''}</li>
      <li><strong>Design ID:</strong> ${order?.designId || ''}</li>
      <li><strong>Title:</strong> ${title}</li>
      <li><strong>Quantity:</strong> ${qty}</li>
      <li><strong>Size:</strong> ${size}</li>
      <li><strong>Total:</strong> ${currency} ${Number(total).toFixed(2)}</li>
    </ul>
    <h3 style="margin-bottom:4px;">Customer Shipping</h3>
    <ul style="margin-top:4px;">
      <li><strong>Name:</strong> ${shippingName || 'N/A'}</li>
      <li><strong>Email:</strong> ${shippingEmail || 'N/A'}</li>
      <li><strong>Address:</strong> ${[
        shippingAddress.line1,
        shippingAddress.line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postalCode,
        shippingAddress.country
      ].filter(Boolean).join(', ') || 'N/A'}</li>
    </ul>
    ${designImageUrl ? `
      <h3 style="margin-bottom:8px;">Design Image</h3>
      <div><a href="${designImageUrl}" target="_blank" rel="noopener">
        <img src="${designImageUrl}" alt="Design image" style="max-width:320px;border:1px solid #eee;border-radius:8px"/>
      </a></div>
    ` : ''}
  </div>`;
}

export async function sendTransactionEmail({ to = getDefaultTo(), subject, order, designImageUrl }) {
  const RESEND_API_KEY = getResendApiKey();
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set; skipping email send');
    return { skipped: true };
  }

  logger.info(`Sending email to: ${to}, Order ID: ${order?.id}`);

  try {
    const html = buildOrderEmailHtml({ order, designImageUrl });
    const payload = {
      from: getDefaultFrom(),
      to: [to],
      subject: subject || `New Order: ${order?.id || ''}`,
      html
    };

    logger.info('Email payload:', { to, subject: payload.subject, from: payload.from });

    const res = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.info(`Resend email queued: ${res.data?.id || 'no-id'}`);
    return res.data;
  } catch (error) {
    logger.error('Failed to send transaction email via Resend:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    // Do not throw; email failure should not break order flow
    return { error: true };
  }
}

// Welcome email template
function buildWelcomeEmailHtml({ userName, userEmail }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Cudliy Design!</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f4f4f4;">
    <div style="max-width:600px; margin:0 auto; background-color:#ffffff;">
      <!-- Header -->
      <div style="background:#313131; padding:40px 20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">Welcome to Cudliy!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding:40px 20px; background:#ffffff;">
        <h2 style="color:#313131; margin-top:0; font-size:22px;">Hi ${userName || 'there'}!</h2>
        <p style="font-size:16px; margin-bottom:20px; color:#313131; line-height:1.6;">
          Welcome to Cudliy Design! We're thrilled to have you join our community of creators who turn imagination into reality.
        </p>
        
        <!-- Features -->
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #e5e5e5;">
          <h3 style="color:#313131; margin-top:0; font-size:18px; font-weight:bold;">What you can do with Cudliy:</h3>
          <ul style="margin:10px 0; padding-left:20px; color:#313131; line-height:1.6;">
            <li style="margin-bottom:8px;">Generate stunning 3D designs from text descriptions</li>
            <li style="margin-bottom:8px;">Create custom images with AI technology</li>
            <li style="margin-bottom:8px;">Send personalized digital gifts to friends</li>
            <li style="margin-bottom:8px;">Access your designs anywhere, anytime</li>
          </ul>
        </div>
        
        <!-- Call to Action -->
        <div style="text-align:center; margin:30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://cudliy.com'}/dashboard" 
             style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block; font-size:16px;">
            Start Creating Now
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #e5e5e5;">
          <p style="color:#666; font-size:12px; margin:0; line-height:1.5;">
            Need help? Reply to this email or visit our support center.<br>
            <a href="https://cudliy.com" style="color:#313131; text-decoration:none;">Visit Cudliy.com</a>
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

// Password reset email template
function buildPasswordResetEmailHtml({ userName, resetLink }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Cudliy Password</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f4f4f4;">
    <div style="max-width:600px; margin:0 auto; background-color:#ffffff;">
      <!-- Header -->
      <div style="background:#313131; padding:30px 20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:bold;">Reset Your Password</h1>
      </div>
      
      <!-- Content -->
      <div style="padding:40px 20px; background:#ffffff;">
        <h2 style="color:#313131; margin-top:0; font-size:20px;">Hi ${userName || 'there'}!</h2>
        <p style="font-size:16px; margin-bottom:20px; color:#313131; line-height:1.6;">
          We received a request to reset your password for your Cudliy account. If you didn't make this request, you can safely ignore this email.
        </p>
        
        <!-- Security Notice -->
        <div style="background:#fff3cd; border:1px solid #ffeaa7; padding:15px; border-radius:8px; margin:20px 0;">
          <p style="margin:0; color:#856404; font-size:14px; line-height:1.5;">
            <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
          </p>
        </div>
        
        <!-- Call to Action -->
        <div style="text-align:center; margin:30px 0;">
          <a href="${resetLink}" 
             style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block; font-size:16px;">
            Reset My Password
          </a>
        </div>
        
        <!-- Alternative Link -->
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0;">
          <p style="color:#666; font-size:14px; margin:0; line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color:#313131; word-break:break-all; text-decoration:underline;">${resetLink}</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #e5e5e5;">
          <p style="color:#666; font-size:12px; margin:0; line-height:1.5;">
            If you didn't request this reset, please contact our support team.<br>
            <a href="https://cudliy.com" style="color:#313131; text-decoration:none;">Visit Cudliy.com</a>
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

// Gift notification email template
function buildGiftEmailHtml({ senderName, recipientName, message, giftLink, designImageUrl }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've Got a Gift from Cudliy!</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f4f4f4;">
    <div style="max-width:600px; margin:0 auto; background-color:#ffffff;">
      <!-- Header -->
      <div style="background:#313131; padding:40px 20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">You've Got a Gift!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding:40px 20px; background:#ffffff;">
        <h2 style="color:#313131; margin-top:0; font-size:22px;">Hi ${recipientName || 'there'}!</h2>
        <p style="font-size:16px; margin-bottom:20px; color:#313131; line-height:1.6;">
          <strong>${senderName || 'Someone special'}</strong> has sent you a personalized 3D design gift through Cudliy Design.
        </p>
        
        ${message ? `
          <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border-left:4px solid #313131;">
            <h3 style="color:#313131; margin-top:0; font-size:16px; font-weight:bold;">Personal Message:</h3>
            <p style="margin:0; font-style:italic; color:#555; line-height:1.5;">"${message}"</p>
          </div>
        ` : ''}
        
        ${designImageUrl ? `
          <div style="text-align:center; margin:30px 0;">
            <img src="${designImageUrl}" alt="Your 3D design gift" style="max-width:300px; height:auto; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);"/>
          </div>
        ` : ''}
        
        <!-- Call to Action -->
        <div style="text-align:center; margin:30px 0;">
          <a href="${giftLink}" 
             style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block; font-size:16px;">
            View Your Gift
          </a>
        </div>
        
        <!-- Instructions -->
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #e5e5e5;">
          <p style="margin:0; color:#313131; font-size:14px; line-height:1.5;">
            <strong>What's next?</strong> Click the link above to view your gift and learn how to order your own physical 3D print.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #e5e5e5;">
          <p style="color:#666; font-size:12px; margin:0;">
            This gift was created using Cudliy Design<br>
            <a href="https://cudliy.com" style="color:#313131; text-decoration:none;">Visit Cudliy.com</a>
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

// Generic email sender function with text support
async function sendEmailWithText({ to, subject, html, text, from = getDefaultFrom() }) {
  const RESEND_API_KEY = getResendApiKey();
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set; skipping email send');
    return { skipped: true };
  }

  try {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `cudliy-${Date.now()}`,
        'List-Unsubscribe': '<https://cudliy.com/unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      tags: [
        {
          name: 'category',
          value: subject.includes('Welcome') ? 'welcome' : 
                 subject.includes('Reset') ? 'password-reset' : 
                 subject.includes('Gift') ? 'gift-notification' : 'transactional'
        }
      ]
    };

    logger.info('Sending email:', { to: payload.to, subject, from });

    const res = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.info(`Email sent successfully: ${res.data?.id || 'no-id'}`);
    return res.data;
  } catch (error) {
    logger.error('Failed to send email via Resend:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    return { error: true, message: error?.message };
  }
}

// Generic email sender function (backward compatibility)
async function sendEmail({ to, subject, html, from = getDefaultFrom() }) {
  const RESEND_API_KEY = getResendApiKey();
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set; skipping email send');
    return { skipped: true };
  }

  try {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `cudliy-${Date.now()}`,
        'List-Unsubscribe': '<https://cudliy.com/unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      tags: [
        {
          name: 'category',
          value: subject.includes('Welcome') ? 'welcome' : 
                 subject.includes('Reset') ? 'password-reset' : 
                 subject.includes('Gift') ? 'gift-notification' : 'transactional'
        }
      ]
    };

    logger.info('Sending email:', { to: payload.to, subject, from });

    const res = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.info(`Email sent successfully: ${res.data?.id || 'no-id'}`);
    return res.data;
  } catch (error) {
    logger.error('Failed to send email via Resend:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    return { error: true, message: error?.message };
  }
}

// Welcome email
export async function sendWelcomeEmail({ to, userName, userEmail }) {
  const html = buildWelcomeEmailHtml({ userName, userEmail });
  const text = `
Hi ${userName || 'there'}!

Welcome to Cudliy Design! We're thrilled to have you join our community of creators who turn imagination into reality.

What you can do with Cudliy:
- Generate stunning 3D designs from text descriptions
- Create custom images with AI technology
- Send personalized digital gifts to friends
- Access your designs anywhere, anytime

Start creating now: ${process.env.FRONTEND_URL || 'https://cudliy.com'}/dashboard

Need help? Reply to this email or visit our support center.
Visit: https://cudliy.com
  `.trim();

  return sendEmailWithText({
    to,
    subject: `Welcome to Cudliy, ${userName || 'Creator'}!`,
    html,
    text
  });
}

// Password reset email
export async function sendPasswordResetEmail({ to, userName, resetLink }) {
  const html = buildPasswordResetEmailHtml({ userName, resetLink });
  const text = `
Hi ${userName || 'there'}!

We received a request to reset your password for your Cudliy account. If you didn't make this request, you can safely ignore this email.

Security Notice: This link will expire in 1 hour for your security.

Reset your password here: ${resetLink}

If you didn't request this reset, please contact our support team.
Visit: https://cudliy.com
  `.trim();

  return sendEmailWithText({
    to,
    subject: 'Reset Your Cudliy Password',
    html,
    text
  });
}

// Gift notification email
export async function sendGiftEmail({ to, senderName, recipientName, message, giftLink, designImageUrl }) {
  const html = buildGiftEmailHtml({ senderName, recipientName, message, giftLink, designImageUrl });
  const text = `
Hi ${recipientName || 'there'}!

${senderName || 'Someone special'} has sent you a personalized 3D design gift through Cudliy Design.

${message ? `Personal Message: "${message}"` : ''}

View your gift here: ${giftLink}

What's next? Click the link above to view your gift and learn how to order your own physical 3D print.

This gift was created using Cudliy Design
Visit: https://cudliy.com
  `.trim();

  return sendEmailWithText({
    to,
    subject: `${senderName || 'Someone'} sent you a gift from Cudliy!`,
    html,
    text
  });
}

export default {
  sendTransactionEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendGiftEmail
};


