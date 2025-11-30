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
  <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto;">
    <div style="background:#313131; padding:40px 20px; text-align:center; border-radius:8px 8px 0 0;">
      <h1 style="color:#ffffff; margin:0; font-size:28px;">Welcome to Cudliy! 🎉</h1>
    </div>
    <div style="background:#ffffff; padding:40px 20px; border-radius:0 0 8px 8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); border:1px solid #e5e5e5;">
      <h2 style="color:#313131; margin-top:0;">Hi ${userName || 'there'}!</h2>
      <p style="font-size:16px; margin-bottom:20px; color:#313131;">
        Welcome to Cudliy Design! We're thrilled to have you join our community of creators who turn imagination into reality.
      </p>
      <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #e5e5e5;">
        <h3 style="color:#313131; margin-top:0;">What you can do with Cudliy:</h3>
        <ul style="margin:10px 0; padding-left:20px; color:#313131;">
          <li>🎨 Generate stunning 3D designs from text descriptions</li>
          <li>🖼️ Create custom images with AI</li>
          <li>🎁 Send personalized digital gifts to friends</li>
          <li>📱 Access your designs anywhere, anytime</li>
        </ul>
      </div>
      <div style="text-align:center; margin:30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
           style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block;">
          Start Creating Now
        </a>
      </div>
      <p style="color:#666; font-size:14px; text-align:center; margin-top:30px;">
        Need help? Reply to this email or visit our support center.
      </p>
    </div>
  </div>`;
}

// Password reset email template
function buildPasswordResetEmailHtml({ userName, resetLink }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto;">
    <div style="background:#313131; padding:30px 20px; text-align:center; border-radius:8px 8px 0 0;">
      <h1 style="color:#ffffff; margin:0; font-size:24px;">Reset Your Password</h1>
    </div>
    <div style="background:#ffffff; padding:40px 20px; border-radius:0 0 8px 8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); border:1px solid #e5e5e5;">
      <h2 style="color:#313131; margin-top:0;">Hi ${userName || 'there'}!</h2>
      <p style="font-size:16px; margin-bottom:20px; color:#313131;">
        We received a request to reset your password for your Cudliy account. If you didn't make this request, you can safely ignore this email.
      </p>
      <div style="background:#fff3cd; border:1px solid #ffeaa7; padding:15px; border-radius:8px; margin:20px 0;">
        <p style="margin:0; color:#856404;">
          <strong>Security tip:</strong> This link will expire in 1 hour for your security.
        </p>
      </div>
      <div style="text-align:center; margin:30px 0;">
        <a href="${resetLink}" 
           style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="color:#666; font-size:14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color:#313131; word-break:break-all;">${resetLink}</a>
      </p>
      <p style="color:#666; font-size:14px; text-align:center; margin-top:30px;">
        If you didn't request this reset, please contact our support team immediately.
      </p>
    </div>
  </div>`;
}

// Gift notification email template
function buildGiftEmailHtml({ senderName, recipientName, message, giftLink, designImageUrl }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto;">
    <div style="background:#313131; padding:40px 20px; text-align:center; border-radius:8px 8px 0 0;">
      <h1 style="color:#ffffff; margin:0; font-size:28px;">🎁 You've Got a Gift!</h1>
    </div>
    <div style="background:#ffffff; padding:40px 20px; border-radius:0 0 8px 8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); border:1px solid #e5e5e5;">
      <h2 style="color:#313131; margin-top:0;">Hi ${recipientName || 'there'}!</h2>
      <p style="font-size:16px; margin-bottom:20px; color:#313131;">
        <strong>${senderName || 'Someone special'}</strong> has sent you a personalized 3D design gift through Cudliy!
      </p>
      
      ${message ? `
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border-left:4px solid #313131;">
          <h3 style="color:#313131; margin-top:0; font-size:16px;">Personal Message:</h3>
          <p style="margin:0; font-style:italic; color:#555;">"${message}"</p>
        </div>
      ` : ''}
      
      ${designImageUrl ? `
        <div style="text-align:center; margin:30px 0;">
          <img src="${designImageUrl}" alt="Your gift design" style="max-width:300px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);"/>
        </div>
      ` : ''}
      
      <div style="text-align:center; margin:30px 0;">
        <a href="${giftLink}" 
           style="background:#313131; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:25px; font-weight:bold; display:inline-block; transition:background-color 0.3s;">
          View Your Gift
        </a>
      </div>
      
      <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0; border:1px solid #e5e5e5;">
        <p style="margin:0; color:#313131; font-size:14px;">
          <strong>What's next?</strong> Click the link above to view your gift and learn how to order your own physical 3D print!
        </p>
      </div>
      
      <p style="color:#666; font-size:14px; text-align:center; margin-top:30px;">
        This gift was created with ❤️ using Cudliy Design
      </p>
    </div>
  </div>`;
}

// Generic email sender function
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
      html
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
  return sendEmail({
    to,
    subject: `Welcome to Cudliy, ${userName || 'Creator'}! 🎨`,
    html
  });
}

// Password reset email
export async function sendPasswordResetEmail({ to, userName, resetLink }) {
  const html = buildPasswordResetEmailHtml({ userName, resetLink });
  return sendEmail({
    to,
    subject: 'Reset Your Cudliy Password',
    html
  });
}

// Gift notification email
export async function sendGiftEmail({ to, senderName, recipientName, message, giftLink, designImageUrl }) {
  const html = buildGiftEmailHtml({ senderName, recipientName, message, giftLink, designImageUrl });
  return sendEmail({
    to,
    subject: `🎁 ${senderName || 'Someone'} sent you a gift from Cudliy!`,
    html
  });
}

export default {
  sendTransactionEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendGiftEmail
};


