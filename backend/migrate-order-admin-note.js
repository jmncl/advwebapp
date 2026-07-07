require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('Applying order admin_note migration...');

    const [cols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'admin_note'`
    );

    if (!cols.length) {
      await sequelize.query('ALTER TABLE orders ADD COLUMN admin_note TEXT NULL');
      console.log('Added orders.admin_note');
    } else {
      console.log('orders.admin_note already exists');
    }

    console.log('Order admin_note migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
