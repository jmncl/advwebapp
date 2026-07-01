require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('Applying 2NF migration...');

    const [orderItemCols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'unit_price'`
    );
    if (orderItemCols.length) {
      await sequelize.query('ALTER TABLE order_items DROP COLUMN unit_price');
      console.log('Dropped order_items.unit_price');
    }

    const [orderCols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'total_amount'`
    );
    if (orderCols.length) {
      await sequelize.query('ALTER TABLE orders DROP COLUMN total_amount');
      console.log('Dropped orders.total_amount');
    }

    await sequelize.query('DROP VIEW IF EXISTS v_order_transaction_details');
    await sequelize.query(`
      CREATE VIEW v_order_transaction_details AS
      SELECT
        o.id AS order_id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.status,
        o.shipping_address,
        o.payment_method,
        o.createdAt AS order_date,
        oi.id AS order_item_id,
        oi.product_id,
        p.item_code,
        p.name AS product_name,
        p.category,
        oi.size,
        oi.quantity,
        p.unit_price,
        (oi.quantity * p.unit_price) AS line_subtotal
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
    `);
    console.log('Created view v_order_transaction_details (computed line_subtotal)');

    console.log('Migration complete. Totals are now computed, not stored.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
