const formatPrice = (amount) => `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const statusColor = (status) => {
  const colors = {
    Pending: '#f0ad4e',
    Processing: '#f0ad4e',
    Shipped: '#28a745',
    Delivered: '#28a745',
    Cancelled: '#ce1141'
  };
  return colors[status] || '#888888';
};

const buildOrderItemsRows = (order) => {
  if (!order.OrderItems || !order.OrderItems.length) {
    return `<tr><td colspan="3" style="padding:12px;color:#888;text-align:center;">No items</td></tr>`;
  }

  return order.OrderItems.map((item) => {
    const name = item.Product ? item.Product.name : 'Product';
    const size = item.size ? ` · Size ${item.size}` : '';
    const subtotal = item.computed_subtotal ?? (parseFloat(item.Product?.unit_price || 0) * item.quantity);
    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #2a2a2a;color:#f0f0f0;font-size:14px;">
          <strong style="color:#fff;">${name}</strong><br>
          <span style="color:#999;font-size:12px;">Qty ${item.quantity}${size}</span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #2a2a2a;color:#ccc;font-size:13px;text-align:center;">${item.quantity}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #2a2a2a;color:#fff;font-size:14px;text-align:right;font-weight:600;">${formatPrice(subtotal)}</td>
      </tr>
    `;
  }).join('');
};

const buildOrderEmail = ({ customerName, order, intro, showStatus = true }) => {
  const total = formatPrice(order.computed_total);
  const orderDate = new Date(order.createdAt).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const statusBadge = showStatus
    ? `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${statusColor(order.status)}22;color:${statusColor(order.status)};font-size:12px;font-weight:700;letter-spacing:0.5px;">${order.status}</span>`
    : '';

  const noteBlock = order.admin_note
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="background:#1a1a1a;border-left:4px solid #ce1141;border-radius:6px;padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:11px;color:#ce1141;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Admin Note</p>
            <p style="margin:0;color:#ddd;font-size:14px;line-height:1.5;">${order.admin_note}</p>
          </div>
        </td>
      </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jordan Brand Store</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#111111;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18);">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:28px 32px 20px;border-bottom:3px solid #ce1141;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;">
                JORDAN <span style="color:#ce1141;">BRAND</span>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Official Store</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 8px;font-size:16px;color:#ccc;">Hi <strong style="color:#fff;">${customerName}</strong>,</p>
              <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${intro}</p>
            </td>
          </tr>

          <!-- Order meta -->
          <tr>
            <td style="padding:16px 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#fff;">#${order.id}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Status</p>
                          <p style="margin:6px 0 0;">${statusBadge}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:12px;">
                          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Date</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#ccc;">${orderDate}</p>
                        </td>
                      </tr>
                      ${order.shipping_address ? `
                      <tr>
                        <td colspan="2" style="padding-top:12px;">
                          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#ccc;line-height:1.5;">${order.shipping_address}</p>
                        </td>
                      </tr>` : ''}
                      ${order.payment_method ? `
                      <tr>
                        <td colspan="2" style="padding-top:12px;">
                          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Payment</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#ccc;">${order.payment_method}</p>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${noteBlock}

          <!-- Items table -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Order Items</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;overflow:hidden;">
                <tr style="background:#222;">
                  <th align="left" style="padding:10px 16px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                  <th align="center" style="padding:10px 16px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;width:60px;">Qty</th>
                  <th align="right" style="padding:10px 16px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Price</th>
                </tr>
                ${buildOrderItemsRows(order)}
                <tr style="background:#111;">
                  <td colspan="2" style="padding:16px;font-size:14px;color:#ccc;font-weight:600;text-align:right;">Grand Total</td>
                  <td style="padding:16px;font-size:18px;color:#ce1141;font-weight:800;text-align:right;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 28px;" align="center">
              <a href="http://localhost:5500/orders.html" style="display:inline-block;background:#ce1141;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;letter-spacing:0.5px;">View My Orders</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;padding:20px 32px;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#666;text-align:center;line-height:1.6;">
                Thank you for shopping at Jordan Brand Store.<br>
                A PDF receipt is attached to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const buildVerificationEmail = ({ customerName, verifyUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email - Jordan Brand Store</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#111111;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
          <tr>
            <td style="background:#111111;padding:28px 32px 20px;border-bottom:3px solid #ce1141;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;">
                JORDAN <span style="color:#ce1141;">BRAND</span>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:16px;color:#ccc;">Hi <strong style="color:#fff;">${customerName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#e0e0e0;line-height:1.6;">
                Thanks for joining Jordan Brand Store! Please verify your email address to activate your account and start shopping.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="border-radius:6px;background:#ce1141;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.5px;">Verify My Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verifyUrl}" style="color:#ce1141;word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:20px 0 0;font-size:12px;color:#666;">
                This link expires in 24 hours. If you didn't create an account, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0a0a0a;padding:20px 32px;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#666;text-align:center;">Jordan Brand Store — Jumpman. Always.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

module.exports = { buildOrderEmail, buildVerificationEmail, formatPrice };
