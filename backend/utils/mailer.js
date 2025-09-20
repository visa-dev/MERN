const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      console.log("Ethereal account created. Preview email URLs will be available in response.");
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }
  })();
  return transporterPromise;
}

async function sendOrderConfirmation(toEmail, order) {
  const transporter = await getTransporter();
  const itemsHtml = order.items.map(i => `<li>${i.name} — size ${i.size} x ${i.quantity} — $${i.price.toFixed(2)}</li>`).join("");
  const html = `
    <h2>Order Confirmation</h2>
    <p>Order ID: <strong>${order._id}</strong></p>
    <p>Order Date: ${new Date(order.createdAt).toLocaleString()}</p>
    <ul>${itemsHtml}</ul>
    <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
  `;
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || '"Clothing Brand" <no-reply@clothingbrand.test>',
    to: toEmail,
    subject: `Order Confirmation - ${order._id}`,
    html
  });
  return nodemailer.getTestMessageUrl(info); // may be null for real SMTP
}

module.exports = { sendOrderConfirmation };
