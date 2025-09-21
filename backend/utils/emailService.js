const nodemailer = require('nodemailer');
const { email: emailConfig } = require('../config/config');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    if (emailConfig.host && emailConfig.user && emailConfig.pass) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      try {
        await this.transporter.verify();
        logger.info(' Email server connection verified');
      } catch (error) {
        logger.warn(' Email server connection failed, using test account');
        await this.createTestAccount();
      }
    } else {
      await this.createTestAccount();
    }
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('📧 Using Ethereal test email account');
    } catch (error) {
      logger.error(' Failed to create test email account:', error);
    }
  }

  async sendOrderConfirmation(order, userEmail = null) {
    const email = userEmail || (order.user ? order.user.email : null);
    if (!email) {
      throw new Error('No email address provided for order confirmation');
    }

    const items = order.items.map(item => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      total: (item.price * item.quantity).toFixed(2),
    }));

    const totalAmount = order.total.toFixed(2);
    const orderDate = order.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = this.createOrderTemplate(order._id.toString().slice(-8).toUpperCase(), items, totalAmount, orderDate);
    const text = this.createOrderText(order._id.toString().slice(-8).toUpperCase(), items, totalAmount, orderDate);

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: `Order Confirmation - #${order._id.toString().slice(-8).toUpperCase()}`,
      html,
      text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`📧 Preview URL: ${previewUrl}`);
        }
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(' Failed to send email:', error);
      throw new Error('Failed to send order confirmation email');
    }
  }

  createOrderTemplate(orderId, items, totalAmount, orderDate) {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.size}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.total}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; text-align: left; padding: 10px; }
          .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; text-align: right; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Confirmation</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Order Date:</strong> ${orderDate}</p>
          
          <h3>Order Details:</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="total">
            <p><strong>Total Amount: $${totalAmount}</strong></p>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>© 2024 Clothing Brand. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  createOrderText(orderId, items, totalAmount, orderDate) {
    const itemsText = items.map(item =>
      `- ${item.name} (Size: ${item.size}) x ${item.quantity} - $${item.total}`
    ).join('\n');

    return `
ORDER CONFIRMATION
==================

Order ID: ${orderId}
Order Date: ${orderDate}

ITEMS:
${itemsText}

TOTAL: $${totalAmount}

Thank you for your order!

If you have any questions, please contact our support team.

© 2024 Clothing Brand. All rights reserved.
    `.trim();
  }
}

module.exports = new EmailService();