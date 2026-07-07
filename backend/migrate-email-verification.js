require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('Applying email verification migration...');

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

    await addColumnIfMissing('users', 'email_verified', 'TINYINT NOT NULL DEFAULT 0');
    await addColumnIfMissing('users', 'verification_token', 'VARCHAR(128) NULL');

    await sequelize.query(
      'UPDATE users SET email_verified = 1 WHERE verification_token IS NULL AND email_verified = 0'
    );
    console.log('Marked existing users as verified.');

    console.log('Email verification migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
