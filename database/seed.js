const path = require('path');
const { Sequelize } = require(path.join(__dirname, '../backend/node_modules/sequelize'));

require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../backend/.env')
});

const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcrypt'));
const db = require(path.join(__dirname, '../backend/models'));

const users = [
  {
    name: 'Admin User',
    email: 'admin@jordanstore.com',
    password: 'admin123',
    role: 'admin',
    is_active: 1,
    email_verified: 1
  },
  {
    name: 'John Customer',
    email: 'customer@jordanstore.com',
    password: 'customer123',
    role: 'customer',
    is_active: 1,
    email_verified: 1,
    customer: {
      fname: 'John',
      lname: 'Customer',
      addressline: '123 Jumpman Street, Manila',
      zipcode: '1000',
      phone: '09171234567'
    }
  }
];

const products = [
  { item_code: 'JB-AJ1-001', name: 'Air Jordan 1 Retro High OG', category: 'Footwear', size: '10', unit_price: 8999.0, description: 'Classic high-top silhouette with premium leather upper. Iconic Wings logo and Air cushioning.', stock_quantity: 25, is_active: 1 },
  { item_code: 'JB-AJ4-002', name: 'Air Jordan 4 Retro', category: 'Footwear', size: '9', unit_price: 9499.0, description: 'Visible Air unit, mesh panels, and plastic wing eyelets. A basketball legend reimagined.', stock_quantity: 18, is_active: 1 },
  { item_code: 'JB-AJ11-003', name: 'Air Jordan 11 Concord', category: 'Footwear', size: '11', unit_price: 10999.0, description: 'Patent leather mudguard and carbon fiber spring plate. Championship-level style.', stock_quantity: 12, is_active: 1 },
  { item_code: 'JB-TS-004', name: 'Jordan Flight Essentials Tee', category: 'Clothing', size: 'L', unit_price: 1899.0, description: 'Soft cotton tee with Jumpman branding. Everyday comfort with iconic Jordan style.', stock_quantity: 50, is_active: 1 },
  { item_code: 'JB-HD-005', name: 'Jordan Sportswear Fleece Hoodie', category: 'Clothing', size: 'M', unit_price: 3499.0, description: 'Brushed fleece hoodie with kangaroo pocket. Warm, relaxed fit for off-court wear.', stock_quantity: 30, is_active: 1 },
  { item_code: 'JB-SH-006', name: 'Jordan Dri-FIT Shorts', category: 'Clothing', size: 'M', unit_price: 2199.0, description: 'Moisture-wicking shorts with elastic waistband. Built for training and casual wear.', stock_quantity: 40, is_active: 1 },
  { item_code: 'JB-AJ3-007', name: 'Air Jordan 3 Retro', category: 'Footwear', size: '10.5', unit_price: 9299.0, description: 'Elephant print overlays and visible Air unit. Tinker Hatfield design classic.', stock_quantity: 15, is_active: 1 },
  { item_code: 'JB-JKT-008', name: 'Jordan Wings Jacket', category: 'Clothing', size: 'XL', unit_price: 4999.0, description: 'Lightweight windbreaker with full zip and Jordan Wings logo on chest.', stock_quantity: 20, is_active: 1 },
  { item_code: 'JB-AJ6-009', name: 'Air Jordan 6 Retro', category: 'Footwear', size: '9.5', unit_price: 9799.0, description: 'Rubber tongue with lace locks and perforated panels. Championship heritage.', stock_quantity: 10, is_active: 1 },
  { item_code: 'JB-CP-010', name: 'Jordan Pro Cap', category: 'Clothing', size: 'One Size', unit_price: 1299.0, description: 'Structured cap with embroidered Jumpman logo. Adjustable strap closure.', stock_quantity: 60, is_active: 1 }
];

const orders = [
  {
    user_email: 'customer@jordanstore.com',
    status: 'Delivered',
    shipping_address: '123 Jumpman Street, Manila 1000',
    payment_method: 'Cash on Delivery',
    createdAt: '2026-05-10T10:30:00.000Z',
    items: [
      { item_code: 'JB-AJ1-001', quantity: 1 },
      { item_code: 'JB-TS-004', quantity: 2 }
    ]
  },
  {
    user_email: 'customer@jordanstore.com',
    status: 'Shipped',
    shipping_address: '123 Jumpman Street, Manila 1000',
    payment_method: 'GCash',
    createdAt: '2026-05-22T14:15:00.000Z',
    items: [{ item_code: 'JB-AJ4-002', quantity: 1 }]
  },
  {
    user_email: 'customer@jordanstore.com',
    status: 'Processing',
    shipping_address: '456 Court Road, Quezon City 1100',
    payment_method: 'Credit Card',
    createdAt: '2026-06-05T09:00:00.000Z',
    items: [
      { item_code: 'JB-HD-005', quantity: 1 },
      { item_code: 'JB-SH-006', quantity: 1 },
      { item_code: 'JB-CP-010', quantity: 1 }
    ]
  },
  {
    user_email: 'customer@jordanstore.com',
    status: 'Pending',
    shipping_address: '123 Jumpman Street, Manila 1000',
    payment_method: 'Cash on Delivery',
    createdAt: '2026-06-18T16:45:00.000Z',
    items: [{ item_code: 'JB-AJ11-003', quantity: 1 }]
  },
  {
    user_email: 'customer@jordanstore.com',
    status: 'Cancelled',
    shipping_address: '789 Sneaker Ave, Makati 1200',
    payment_method: 'GCash',
    createdAt: '2026-06-01T11:20:00.000Z',
    items: [
      { item_code: 'JB-AJ6-009', quantity: 1 },
      { item_code: 'JB-JKT-008', quantity: 1 }
    ]
  }
];

async function seed({ force = false } = {}) {
  await db.sequelize.sync({ force });
  console.log(force ? 'Tables recreated.' : 'Tables synced.');

  console.log('Seeding users...');
  for (const userData of users) {
    const { customer, password, ...userFields } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({ ...userFields, password: hashedPassword });

    if (customer) {
      await db.Customer.create({ user_id: user.id, ...customer });
    }

    console.log(`  User: ${user.email} / ${password} (${user.role})`);
  }

  console.log('Seeding products...');
  await db.Product.bulkCreate(products);
  console.log(`  Products: ${products.length} Jordan Brand items`);

  console.log('Seeding orders...');
  let orderCount = 0;
  for (const orderData of orders) {
    const { user_email, items, createdAt, ...orderFields } = orderData;
    const user = await db.User.findOne({ where: { email: user_email } });
    if (!user) continue;

    const order = await db.Order.create({
      ...orderFields,
      user_id: user.id,
      createdAt: new Date(createdAt),
      updatedAt: new Date(createdAt)
    });

    for (const item of items) {
      const product = await db.Product.findOne({ where: { item_code: item.item_code } });
      if (!product) continue;

      await db.OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        quantity: item.quantity,
        size: item.size || product.size
      });
    }

    orderCount += 1;
    console.log(`  Order #${order.id}: ${order.status} (${items.length} item(s)) for ${user_email}`);
  }
  console.log(`  Orders: ${orderCount} sample transactions`);

  console.log('Seeding complete.');
}

async function resetDatabase() {
  const dbName = process.env.DB_NAME;
  const sequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  });

  await sequelize.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await sequelize.query(`CREATE DATABASE \`${dbName}\``);
  await sequelize.close();

  console.log(`Dropped and recreated database: ${dbName}`);
  await seed({ force: true });
}

const isReset = process.argv.includes('--reset');
const runner = isReset ? resetDatabase() : seed({ force: true });

runner
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(isReset ? 'Reset failed:' : 'Seed failed:', err.message);
    process.exit(1);
  });
