# Jordan Brand Store Management System

Tim Quirsten Tan & John Manuel Tianzon — BSIT-S-2A

Node.js + jQuery e-commerce app for Jordan Brand apparel and footwear.

## Prerequisites

- Node.js (v18+)
- MySQL (XAMPP/WAMP or standalone)
- VS Code Live Server extension (recommended for frontend)

## Setup

### 1. Create MySQL database

```sql
CREATE DATABASE jordan_shop_db;
```

### 2. Install backend dependencies

```bash
cd jordan-brand-store/backend
npm install
mkdir uploads
```

### 3. Configure `.env`

Edit `backend/.env` — set your MySQL password if needed:

```
DB_PASSWORD=your_mysql_password
```

### 4. Reset and seed database

Drop the database, recreate it, and load sample data:

```bash
cd backend
npm run db:reset
```

To reseed without dropping the database (recreates tables):

```bash
npm run db:seed
```

All seed data lives in `database/seed.js`.

### 5. Start backend API

```bash
cd jordan-brand-store/backend
npm start
```

API runs at: **http://localhost:4001**

### 6. Open frontend

Open `frontend/index.html` with **Live Server** in VS Code, or any static file server.

Right-click `frontend/index.html` → Open with Live Server

## Demo Accounts

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@jordanstore.com      | admin123     |
| Customer | customer@jordanstore.com   | customer123  |

## What You Can Test Now

- Homepage with 10 Jordan products, search autocomplete, category/price filters, pagination
- Login / Register (AJAX, no page reload)
- Product detail + Add to Cart
- Shopping cart, checkout, place order
- My Orders with infinite scroll
- Admin: Dashboard with charts, Product CRUD (DataTables), User management, Order status updates

## Email (Optional)

Add Mailtrap credentials in `backend/.env` for order confirmation and status update emails with PDF receipt.
