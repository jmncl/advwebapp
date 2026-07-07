const PDFDocument = require('pdfkit');
const { computeOrderTotal, computeItemSubtotal } = require('./orderTotals');

const RED = '#ce1141';
const DARK = '#111111';
const GRAY = '#666666';

const generateOrderReceipt = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const total = order.computed_total ?? computeOrderTotal(order);
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.rect(0, 0, doc.page.width, 8).fill(RED);

    doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold')
      .text('JORDAN BRAND', { align: 'center' });
    doc.fillColor(RED).fontSize(11).font('Helvetica-Bold')
      .text('OFFICIAL STORE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor(GRAY).fontSize(12).font('Helvetica')
      .text('Order Receipt', { align: 'center' });
    doc.moveDown(1);

    doc.strokeColor(RED).lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.8);

    const meta = [
      ['Order ID', `#${order.id}`],
      ['Status', order.status],
      ['Date', new Date(order.createdAt).toLocaleString('en-PH')],
      ['Shipping', order.shipping_address || 'N/A'],
      ['Payment', order.payment_method || 'N/A']
    ];

    meta.forEach(([label, value]) => {
      doc.fillColor(GRAY).fontSize(9).font('Helvetica-Bold').text(`${label.toUpperCase()}`, { continued: false });
      doc.fillColor(DARK).fontSize(11).font('Helvetica').text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Items');
    doc.moveDown(0.4);

    if (order.OrderItems) {
      order.OrderItems.forEach((item) => {
        const name = item.Product ? item.Product.name : 'Product';
        const size = item.size ? ` · Size ${item.size}` : '';
        const subtotal = item.computed_subtotal ?? computeItemSubtotal(item);
        doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(`${name}${size}`);
        doc.fillColor(GRAY).fontSize(10).font('Helvetica')
          .text(`Qty ${item.quantity}  —  ${subtotal.toFixed(2)} PHP`, { indent: 10 });
        doc.moveDown(0.4);
      });
    }

    doc.moveDown(0.5);
    doc.strokeColor('#e0e0e0').lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
      .text('Grand Total', doc.page.margins.left, doc.y, { width: pageWidth * 0.6, align: 'left', continued: true });
    doc.fillColor(RED).fontSize(16).font('Helvetica-Bold')
      .text(`PHP ${total.toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
      .text('Thank you for shopping at Jordan Brand Store.', { align: 'center' });

    doc.end();
  });
};

module.exports = { generateOrderReceipt };
