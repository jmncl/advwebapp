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
  },
  {
    name: 'Maria Santos',
    email: 'maria@jordanstore.com',
    password: 'customer123',
    role: 'customer',
    is_active: 1,
    email_verified: 1,
    customer: {
      fname: 'Maria',
      lname: 'Santos',
      addressline: '88 Court Road, Quezon City',
      zipcode: '1100',
      phone: '09189876543'
    }
  }
];

const productCatalog = [
  { item_code: 'JB-SH-001', name: 'Air Jordan 1 Retro High OG', category: 'Shoes', size: '10', unit_price: 8999.0, description: 'Classic high-top silhouette with premium leather upper and Air cushioning.', stock_quantity: 25, is_active: 1 },
  { item_code: 'JB-SH-002', name: 'Air Jordan 4 Retro', category: 'Shoes', size: '9', unit_price: 9499.0, description: 'Visible Air unit, mesh panels, and plastic wing eyelets.', stock_quantity: 18, is_active: 1 },
  { item_code: 'JB-SH-003', name: 'Air Jordan 11 Concord', category: 'Shoes', size: '11', unit_price: 10999.0, description: 'Patent leather mudguard and carbon fiber spring plate.', stock_quantity: 12, is_active: 1 },
  { item_code: 'JB-SH-004', name: 'Air Jordan 3 Retro', category: 'Shoes', size: '10.5', unit_price: 9299.0, description: 'Elephant print overlays and visible Air unit.', stock_quantity: 15, is_active: 1 },
  { item_code: 'JB-SH-005', name: 'Air Jordan 6 Retro', category: 'Shoes', size: '9.5', unit_price: 9799.0, description: 'Rubber tongue with lace locks and perforated panels.', stock_quantity: 10, is_active: 1 },
  { item_code: 'JB-SH-006', name: 'Air Jordan 5 Retro Fire Red', category: 'Shoes', size: '10', unit_price: 9599.0, description: 'Reflective tongue and fighter-jet inspired midsole.', stock_quantity: 14, is_active: 1 },
  { item_code: 'JB-SH-007', name: 'Air Jordan 12 Taxi', category: 'Shoes', size: '11', unit_price: 10299.0, description: 'Premium leather upper with stitched detailing.', stock_quantity: 11, is_active: 1 },
  { item_code: 'JB-SH-008', name: 'Air Jordan 13 Flint', category: 'Shoes', size: '9', unit_price: 9999.0, description: 'Panther paw-inspired outsole and holographic detail.', stock_quantity: 13, is_active: 1 },
  { item_code: 'JB-SH-009', name: 'Air Jordan 2 Retro', category: 'Shoes', size: '10', unit_price: 8499.0, description: 'Luxurious Italian-inspired construction and lines.', stock_quantity: 16, is_active: 1 },
  { item_code: 'JB-SH-010', name: 'Air Jordan 14 Last Shot', category: 'Shoes', size: '10.5', unit_price: 10499.0, description: 'Ferrari-inspired design worn during championship moments.', stock_quantity: 9, is_active: 1 },

  { item_code: 'JB-AP-011', name: 'Jordan Flight Essentials Tee', category: 'Apparel', size: 'L', unit_price: 1899.0, description: 'Soft cotton tee with Jumpman branding.', stock_quantity: 50, is_active: 1 },
  { item_code: 'JB-AP-012', name: 'Jordan Jumpman Classic Tee', category: 'Apparel', size: 'M', unit_price: 1699.0, description: 'Lightweight cotton tee with bold Jumpman chest logo.', stock_quantity: 45, is_active: 1 },
  { item_code: 'JB-AP-013', name: 'Jordan Sport DNA Tee', category: 'Apparel', size: 'XL', unit_price: 1799.0, description: 'Breathable cotton blend with heritage Jordan graphics.', stock_quantity: 42, is_active: 1 },
  { item_code: 'JB-AP-014', name: 'Jordan Monumental Tee', category: 'Apparel', size: 'L', unit_price: 1599.0, description: 'Everyday fit tee with minimalist Jumpman print.', stock_quantity: 48, is_active: 1 },
  { item_code: 'JB-AP-015', name: 'Jordan Air Logo Tee', category: 'Apparel', size: 'M', unit_price: 1749.0, description: 'Classic fit tee with oversized Air Jordan logo.', stock_quantity: 40, is_active: 1 },
  { item_code: 'JB-AP-016', name: 'Jordan Dri-FIT Shorts', category: 'Apparel', size: 'M', unit_price: 2199.0, description: 'Moisture-wicking shorts with elastic waistband.', stock_quantity: 40, is_active: 1 },
  { item_code: 'JB-AP-017', name: 'Jordan Sportswear Fleece Shorts', category: 'Apparel', size: 'L', unit_price: 1999.0, description: 'Brushed fleece shorts with drawcord waist.', stock_quantity: 35, is_active: 1 },
  { item_code: 'JB-AP-018', name: 'Jordan Diamond Shorts', category: 'Apparel', size: 'M', unit_price: 2299.0, description: 'Lightweight training shorts with side pockets.', stock_quantity: 38, is_active: 1 },
  { item_code: 'JB-AP-019', name: 'Jordan Essentials Mesh Shorts', category: 'Apparel', size: 'XL', unit_price: 1899.0, description: 'Mesh-lined shorts built for warm-weather comfort.', stock_quantity: 33, is_active: 1 },
  { item_code: 'JB-AP-020', name: 'Jordan Pinnacle Shorts', category: 'Apparel', size: 'L', unit_price: 2099.0, description: 'Premium fleece shorts with embroidered Jumpman.', stock_quantity: 36, is_active: 1 },

  { item_code: 'JB-AC-021', name: 'Jordan Heritage Backpack', category: 'Accessories', size: 'One Size', unit_price: 3499.0, description: 'Durable backpack with padded laptop sleeve.', stock_quantity: 30, is_active: 1 },
  { item_code: 'JB-AC-022', name: 'Jordan Everyday Crew Socks (3-Pack)', category: 'Accessories', size: 'One Size', unit_price: 899.0, description: 'Cushioned crew socks with moisture-wicking fabric.', stock_quantity: 80, is_active: 1 },
  { item_code: 'JB-AC-023', name: 'Jordan Ultimate Backpack', category: 'Accessories', size: 'One Size', unit_price: 4299.0, description: 'Large-capacity backpack with multiple compartments.', stock_quantity: 22, is_active: 1 },
  { item_code: 'JB-AC-024', name: 'Jordan Quarter Socks (6-Pack)', category: 'Accessories', size: 'One Size', unit_price: 1099.0, description: 'Quarter-length socks with arch support.', stock_quantity: 70, is_active: 1 },
  { item_code: 'JB-AC-025', name: 'Jordan Duffel Bag', category: 'Accessories', size: 'One Size', unit_price: 3899.0, description: 'Spacious duffel for gym and travel days.', stock_quantity: 25, is_active: 1 },
  { item_code: 'JB-AC-026', name: 'Jordan Sport Carry Bag', category: 'Accessories', size: 'One Size', unit_price: 2799.0, description: 'Compact carry bag with adjustable shoulder strap.', stock_quantity: 28, is_active: 1 },
  { item_code: 'JB-AC-027', name: 'Jordan Ankle Socks (3-Pack)', category: 'Accessories', size: 'One Size', unit_price: 799.0, description: 'Low-cut socks with heel and toe cushioning.', stock_quantity: 90, is_active: 1 },
  { item_code: 'JB-AC-028', name: 'Jordan Jumpman Crossbody Bag', category: 'Accessories', size: 'One Size', unit_price: 2499.0, description: 'Crossbody bag for essentials on the go.', stock_quantity: 32, is_active: 1 },
  { item_code: 'JB-AC-029', name: 'Jordan Performance Socks (2-Pack)', category: 'Accessories', size: 'One Size', unit_price: 999.0, description: 'Performance socks with targeted cushioning zones.', stock_quantity: 65, is_active: 1 },
  { item_code: 'JB-AC-030', name: 'Jordan Mini Backpack', category: 'Accessories', size: 'One Size', unit_price: 2999.0, description: 'Compact mini backpack with front zip pocket.', stock_quantity: 27, is_active: 1 }
];

const products = productCatalog.map((product, index) => ({
  ...product,
  image_url: `uploads/jb${String(index + 1).padStart(3, '0')}.jpg`
}));

const shoes = productCatalog.filter((p) => p.category === 'Shoes').map((p) => p.item_code);
const apparel = productCatalog.filter((p) => p.category === 'Apparel').map((p) => p.item_code);
const accessories = productCatalog.filter((p) => p.category === 'Accessories').map((p) => p.item_code);

const customerProfiles = [
  {
    email: 'customer@jordanstore.com',
    addresses: [
      '123 Jumpman Street, Manila 1000',
      '456 Court Road, Quezon City 1100',
      '789 Sneaker Ave, Makati 1200'
    ]
  },
  {
    email: 'maria@jordanstore.com',
    addresses: [
      '88 Court Road, Quezon City 1100',
      '15 Lakeview Drive, Pasig 1600',
      '204 Heritage Lane, Taguig 1630'
    ]
  }
];

const paymentMethods = ['Cash on Delivery', 'GCash', 'Credit Card', 'Maya'];

const monthlyPlan = [
  { month: 1, count: 4, shoeBias: 0.15 },
  { month: 2, count: 7, shoeBias: 0.35 },
  { month: 3, count: 10, shoeBias: 0.65 },
  { month: 4, count: 5, shoeBias: 0.25 },
  { month: 5, count: 9, shoeBias: 0.5 },
  { month: 6, count: 6, shoeBias: 0.3 },
  { month: 7, count: 6, shoeBias: 0.45 }
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pickProduct = (pool) => {
  const code = pick(pool);
  return { item_code: code, quantity: Math.random() > 0.75 ? 2 : 1 };
};

const buildOrderItems = (shoeBias) => {
  const items = [];
  const roll = Math.random();

  if (roll < shoeBias) {
    items.push(pickProduct(shoes));
    if (Math.random() > 0.55) items.push(pickProduct(accessories));
  } else if (roll < shoeBias + 0.45) {
    items.push(pickProduct(apparel));
    if (Math.random() > 0.5) items.push(pickProduct(apparel));
    if (Math.random() > 0.65) items.push(pickProduct(accessories));
  } else {
    items.push(pickProduct(accessories));
    if (Math.random() > 0.45) items.push(pickProduct(accessories));
    if (Math.random() > 0.7) items.push(pickProduct(apparel));
  }

  return items;
};

const buildOrders = () => {
  const orders = [];
  let orderIndex = 0;

  monthlyPlan.forEach(({ month, count, shoeBias }) => {
    for (let i = 0; i < count; i += 1) {
      const day = Math.min(28, 2 + Math.floor(Math.random() * 26));
      const hour = 9 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 60);
      const customer = customerProfiles[orderIndex % 2];
      const statusRoll = Math.random();

      let status = 'Delivered';
      if (statusRoll > 0.92) status = 'Cancelled';
      else if (statusRoll > 0.84) status = 'Pending';
      else if (statusRoll > 0.72) status = 'Processing';
      else if (statusRoll > 0.55) status = 'Shipped';

      if (month === 7 && status === 'Delivered' && day > 7) {
        status = pick(['Processing', 'Shipped', 'Pending']);
      }

      orders.push({
        user_email: customer.email,
        status,
        shipping_address: pick(customer.addresses),
        payment_method: pick(paymentMethods),
        createdAt: new Date(2026, month - 1, day, hour, minute, 0).toISOString(),
        items: buildOrderItems(shoeBias)
      });

      orderIndex += 1;
    }
  });

  return orders;
};

const orders = buildOrders();

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
  const shoesCount = products.filter((p) => p.category === 'Shoes').length;
  const apparelCount = products.filter((p) => p.category === 'Apparel').length;
  const accessoriesCount = products.filter((p) => p.category === 'Accessories').length;
  console.log(`  Products: ${products.length} total (${shoesCount} Shoes, ${apparelCount} Apparel, ${accessoriesCount} Accessories)`);

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
        product_name: product.name,
        unit_price: product.unit_price,
        quantity: item.quantity,
        size: item.size || product.size
      });
    }

    orderCount += 1;
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
