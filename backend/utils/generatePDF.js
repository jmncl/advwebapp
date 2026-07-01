const PDFDocument = require('pdfkit');
const { computeOrderTotal, computeItemSubtotal } = require('./orderTotals');

const generateOrderReceipt = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const total = order.computed_total ?? computeOrderTotal(order);

    doc.fontSize(20).text('JORDAN BRAND STORE', { align: 'center' });
    doc.fontSize(12).text('Order Receipt', { align: 'center' });
    doc.moveDown();
    doc.text(`Order ID: #${order.id}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Shipping Address: ${order.shipping_address || 'N/A'}`);
    doc.moveDown();
    doc.text('Items:', { underline: true });

    if (order.OrderItems) {
      order.OrderItems.forEach((item) => {
        const name = item.Product ? item.Product.name : 'Product';
        const size = item.size ? ` (Size: ${item.size})` : '';
        const subtotal = item.computed_subtotal ?? computeItemSubtotal(item);
        const unitPrice = item.Product?.unit_price || 0;
        doc.text(`- ${name}${size} x${item.quantity} @ ₱${unitPrice} = ₱${subtotal.toFixed(2)}`);
      });
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₱${total.toFixed(2)}`, { align: 'right' });
    doc.end();
  });
};

module.exports = { generateOrderReceipt };
