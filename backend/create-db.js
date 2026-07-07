require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'jordan_shop_db'}`);
  console.log(`Database '${process.env.DB_NAME}' ready.`);
  await conn.end();
}

createDb().catch((err) => {
  console.error('Could not create database:', err.message);
  process.exit(1);
});
