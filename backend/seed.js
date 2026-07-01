require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./models');

const products = [
  { item_code: 'JB-AJ1-001', name: 'Air Jordan 1 Retro High OG', category: 'Footwear', size: '10', unit_price: 8999.00, description: 'Classic high-top silhouette with premium leather upper.', stock_quantity: 25, is_active: 1 },
  { item_code: 'JB-AJ4-002', name: 'Air Jordan 4 Retro', category: 'Footwear', size: '9', unit_price: 9499.00, description: 'Visible Air unit and mesh panels.', stock_quantity: 18, is_active: 1 },
  { item_code: 'JB-AJ11-003', name: 'Air Jordan 11 Concord', category: 'Footwear', size: '11', unit_price: 10999.00, description: 'Patent leather mudguard and carbon fiber spring plate.', stock_quantity: 12, is_active: 1 },
  { item_code: 'JB-TS-004', name: 'Jordan Flight Essentials Tee', category: 'Clothing', size: 'L', unit_price: 1899.00, description: 'Soft cotton tee with Jumpman branding.', stock_quantity: 50, is_active: 1 },
  { item_code: 'JB-HD-005', name: 'Jordan Sportswear Fleece Hoodie', category: 'Clothing', size: 'M', unit_price: 3499.00, description: 'Brushed fleece hoodie with kangaroo pocket.', stock_quantity: 30, is_active: 1 },
  { item_code: 'JB-SH-006', name: 'Jordan Dri-FIT Shorts', category: 'Clothing', size: 'M', unit_price: 2199.00, description: 'Moisture-wicking shorts with elastic waistband.', stock_quantity: 40, is_active: 1 },
  { item_code: 'JB-AJ3-007', name: 'Air Jordan 3 Retro', category: 'Footwear', size: '10.5', unit_price: 9299.00, description: 'Elephant print overlays and visible Air unit.', stock_quantity: 15, is_active: 1 },
  { item_code: 'JB-JKT-008', name: 'Jordan Wings Jacket', category: 'Clothing', size: 'XL', unit_price: 4999.00, description: 'Lightweight windbreaker with Jordan Wings logo.', stock_quantity: 20, is_active: 1 },
  { item_code: 'JB-AJ6-009', name: 'Air Jordan 6 Retro', category: 'Footwear', size: '9.5', unit_price: 9799.00, description: 'Rubber tongue with lace locks.', stock_quantity: 10, is_active: 1 },
  { item_code: 'JB-CP-010', name: 'Jordan Pro Cap', category: 'Clothing', size: 'One Size', unit_price: 1299.00, description: 'Structured cap with embroidered Jumpman logo.', stock_quantity: 60, is_active: 1 }
];

async function seed() {
  try {
    await db.sequelize.sync({ alter: false });
    console.log('Tables synced.');

    const adminPass = await bcrypt.hash('admin123', 10);
    const customerPass = await bcrypt.hash('customer123', 10);

    const [admin] = await db.User.findOrCreate({
      where: { email: 'admin@jordanstore.com' },
      defaults: { name: 'Admin User', email: 'admin@jordanstore.com', password: adminPass, role: 'admin', is_active: 1 }
    });
    await admin.update({ password: adminPass, role: 'admin', is_active: 1 });

    const [customer] = await db.User.findOrCreate({
      where: { email: 'customer@jordanstore.com' },
      defaults: { name: 'John Customer', email: 'customer@jordanstore.com', password: customerPass, role: 'customer', is_active: 1 }
    });
    await customer.update({ password: customerPass });

    console.log('Users: admin@jordanstore.com / admin123');
    console.log('Users: customer@jordanstore.com / customer123');

    for (const p of products) {
      await db.Product.findOrCreate({ where: { item_code: p.item_code }, defaults: p });
    }

    console.log(`Seeded ${products.length} Jordan Brand products.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
