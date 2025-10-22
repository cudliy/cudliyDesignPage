import axios from 'axios';
import logger from '../utils/logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const DEFAULT_TO = process.env.ORDER_NOTIFY_EMAIL || 'cudliy123@gmail.com';

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

export async function sendTransactionEmail({ to = DEFAULT_TO, subject, order, designImageUrl }) {
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set; skipping email send');
    return { skipped: true };
  }

  logger.info(`Sending email to: ${to}, Order ID: ${order?.id}`);

  try {
    const html = buildOrderEmailHtml({ order, designImageUrl });
    const payload = {
      from: DEFAULT_FROM,
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

export default {
  sendTransactionEmail
};


