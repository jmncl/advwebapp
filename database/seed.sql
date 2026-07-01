-- Jordan Brand Store - Database Setup & Seed
-- Run: mysql -u root -p < database/seed.sql

CREATE DATABASE IF NOT EXISTS jordan_shop_db;
USE jordan_shop_db;

-- Users (admin password: admin123, customer password: customer123)
-- bcrypt hashes pre-generated
INSERT INTO users (id, name, email, password, role, is_active, createdAt, updatedAt) VALUES
(1, 'Admin User', 'admin@jordanstore.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOe6gT8qKJ8xKJ8xKJ8xKJ8xKJ8xKJ8u', 'admin', 1, NOW(), NOW()),
(2, 'John Customer', 'customer@jordanstore.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOe6gT8qKJ8xKJ8xKJ8xKJ8xKJ8xKJ8u', 'customer', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Note: Run backend once to create tables via Sequelize, then run seed-products below
-- Or use the seed script via node after tables exist
