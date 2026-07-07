require('dotenv').config();
const sequelize = require('./config/database');

async function columnExists(table, column) {
  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return cols.length > 0;
}

async function migrate() {
  try {
    console.log('Applying order item snapshot migration...');

    if (!(await columnExists('order_items', 'product_name'))) {
      await sequelize.query('ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) NULL');
      console.log('Added order_items.product_name');
    } else {
      console.log('order_items.product_name already exists');
    }

    if (!(await columnExists('order_items', 'unit_price'))) {
      await sequelize.query('ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10, 2) NULL');
      console.log('Added order_items.unit_price');
    } else {
      console.log('order_items.unit_price already exists');
    }

    const [result] = await sequelize.query(
      `UPDATE order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       SET oi.product_name = COALESCE(oi.product_name, p.name),
           oi.unit_price = COALESCE(oi.unit_price, p.unit_price)
       WHERE oi.product_name IS NULL OR oi.unit_price IS NULL`
    );
    console.log(`Backfilled ${result.affectedRows || 0} order item snapshot(s).`);

    await sequelize.query(
      `ALTER TABLE order_items
       MODIFY COLUMN product_name VARCHAR(255) NOT NULL,
       MODIFY COLUMN unit_price DECIMAL(10, 2) NOT NULL`
    );
    console.log('Enforced NOT NULL on snapshot columns.');

    console.log('Order item snapshot migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
