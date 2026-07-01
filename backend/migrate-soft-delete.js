require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('Applying soft delete migration...');

    const addColumnIfMissing = async (table, column, definition) => {
      const [cols] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`
      );
      if (!cols.length) {
        await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added ${table}.${column}`);
      }
    };

    await addColumnIfMissing('cart', 'deleted_at', 'DATETIME NULL');
    await addColumnIfMissing('orders', 'deleted_at', 'DATETIME NULL');

    console.log('Soft delete migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
