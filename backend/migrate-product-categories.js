require('dotenv').config();
const sequelize = require('./config/database');

const categoryMap = {
  Footwear: 'Shoes',
  Clothing: 'Apparel'
};

const accessoryCodes = new Set(['JB-CP-010']);

async function migrate() {
  try {
    console.log('Applying product category migration...');

    await sequelize.query(
      "ALTER TABLE products MODIFY COLUMN category VARCHAR(20) NOT NULL"
    );
    console.log('Converted category column to VARCHAR.');

    const [products] = await sequelize.query('SELECT id, item_code, category FROM products');

    for (const product of products) {
      let category = categoryMap[product.category] || product.category;

      if (accessoryCodes.has(product.item_code)) {
        category = 'Accessories';
      }

      await sequelize.query(
        'UPDATE products SET category = ? WHERE id = ?',
        { replacements: [category, product.id] }
      );
    }

    console.log(`Updated ${products.length} product categor(ies).`);

    await sequelize.query(
      "ALTER TABLE products MODIFY COLUMN category ENUM('Shoes', 'Apparel', 'Accessories') NOT NULL"
    );
    console.log('Set category ENUM to Shoes, Apparel, Accessories.');

    console.log('Product category migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
