# ApexFlow: Mini ERP + CRM Operations Portal

> **Production-Quality Internship Case Study** for a wholesale/distribution company.  
> Designed to be simple, robust, architecturally sound, and 100% interview-friendly for freshers and early-career software engineers.

---

## 1. Project Overview

**ApexFlow** is an integrated **Mini ERP (Enterprise Resource Planning) + CRM (Customer Relationship Management)** portal engineered specifically for wholesale distributors. In wholesale operations, managing leads, tracking bulk product stock across warehouse bays, generating delivery challans, and preventing stock discrepancies are critical.

This application demonstrates:
- **Role-Based Access Control (RBAC)** across 4 distinct corporate personas: `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.
- **ACID Database Transactions** using raw PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to guarantee stock cannot be oversold, duplicated, or corrupted under concurrent order confirmation.
- **Historical Product Snapshots** to preserve the price, SKU, and name on historic delivery slips even when master catalog prices change in the future.
- **Immutable Inventory Audit Ledger** tracking every inbound (`IN`) and outbound (`OUT`) movement.

---

## 2. Tech Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 18 + TypeScript SPA                   │
│   (Vite, Tailwind CSS, Lucide Icons, Responsive Drawer)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP (Axios + JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express.js + TypeScript API                 │
│      (Layered: Routes ➔ Controllers ➔ Services ➔ Repos)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized SQL + Transactions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL 18                           │
│     (ACID, Row-level Locks, Indexes, Foreign Keys)          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Breakdown
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Axios, React Router 6, Lucide React.
- **Backend**: Node.js, Express.js, TypeScript, `pg` (PostgreSQL client pool), `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`.
- **Database**: PostgreSQL (relational tables, foreign key constraints, B-tree indexes).
- **Security**: JWT Bearer token authentication, bcrypt password hashing, input validation middleware, parameterized SQL (prevents SQL injection).

---

## 3. User Roles & Access Control (RBAC)

The portal implements strict authorization on **both** the frontend (hiding/showing navigation items) and the backend (middleware guards):

| Module / Operation | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|
| **Executive Dashboard** | View All | View All | View All | View All |
| **Customers CRM (View)** | Full Access | Full Access | No Access | View Only |
| **Customers CRM (Create/Edit)** | Full Access | Full Access | No Access | No Access |
| **Customer Follow-up Notes** | View & Add | View & Add | No Access | View Only |
| **Products Catalog (View)** | Full Access | View Only | Full Access | View Only |
| **Products (Create/Edit)** | Full Access | No Access | Full Access | No Access |
| **Stock Movements (Audit Ledger)** | Full Access | No Access | View & Intake | No Access |
| **Sales Challans (View)** | Full Access | Full Access | View Only | View Only |
| **Sales Challans (Create Draft)** | Full Access | Full Access | No Access | No Access |
| **Sales Challans (Confirm/Deduct)** | Full Access | Full Access | No Access | No Access |
| **User Administration** | Full Access | No Access | No Access | No Access |

---

## 4. Critical Stock Business Logic (Fresher Interview Guide)

### Why is Stock Logic Handled ONLY on the Backend?
A frontend client can be manipulated (via developer tools, API requests, network tampering). Inventory integrity is a core financial metric and must be strictly verified and committed by the database engine.

### Step-by-step Confirmation Flow
```
Client triggers PUT /api/challans/:id/confirm
                           │
                           ▼
              Acquire DB Client from Pool
                           │
                           ▼
                     BEGIN TRANSACTION
                           │
                           ▼
          SELECT ... FROM challans WHERE id = $1 FOR UPDATE
            (Prevents concurrent double confirmations)
                           │
                           ▼
                 Is status === 'DRAFT'?
                  ├─ NO  ➔ ROLLBACK & return HTTP 400
                  └─ YES ➔ Continue
                           │
                           ▼
        FOR EACH item IN challan_items:
          SELECT current_stock FROM products WHERE id = item.product_id FOR UPDATE
          Is current_stock >= item.quantity?
            ├─ NO  ➔ ROLLBACK & return HTTP 400:
            │        "Insufficient stock for product X. Available: 6, Requested: 10"
            └─ YES ➔ Continue
                           │
                           ▼
        UPDATE products SET current_stock = current_stock - quantity
        INSERT INTO stock_movements (product_id, qty, 'OUT', reason, user_id)
        UPDATE challans SET status = 'CONFIRMED'
                           │
                           ▼
                    COMMIT TRANSACTION
                           │
                           ▼
              Release DB Client to Pool & Return 200
```
## 5. Database Schema

```sql
-- 1. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers CRM Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  business_name VARCHAR(150),
  gst_number VARCHAR(50),
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Active', 'Inactive')),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products & Stock Master
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock INT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  warehouse_location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stock Movement Audit Trail
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_changed INT NOT NULL,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  reason VARCHAR(255) NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sales Challans Master
CREATE TABLE challans (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  total_quantity INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Challan Items (Product Snapshot)
CREATE TABLE challan_items (
  id SERIAL PRIMARY KEY,
  challan_id INT NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_snapshot VARCHAR(150) NOT NULL,
  sku_snapshot VARCHAR(50) NOT NULL,
  unit_price_snapshot NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(12, 2) NOT NULL
);

-- 7. Customer Follow-up History
CREATE TABLE follow_ups (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  follow_up_date DATE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Required B-Tree Indexes
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_challans_number ON challans(challan_number);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_challan_items_challan ON challan_items(challan_id);
CREATE INDEX idx_follow_ups_customer ON follow_ups(customer_id);
```

---

## 6. API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Authenticate using email and password, returns JWT token & user info.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Customer CRM
- `GET /api/customers` - List customers with pagination, search, status & type filter.
- `POST /api/customers` - Create customer. *(Roles: ADMIN, SALES)*
- `GET /api/customers/:id` - Fetch customer details.
- `PUT /api/customers/:id` - Update customer. *(Roles: ADMIN, SALES)*
- `DELETE /api/customers/:id` - Delete customer. *(Roles: ADMIN)*
- `GET /api/customers/:id/follow-ups` - Get follow-up interaction history.
- `POST /api/customers/:id/follow-ups` - Add follow-up note. *(Roles: ADMIN, SALES)*

### Products & Inventory
- `GET /api/products` - List products (search, category, `low_stock=true` filter).
- `GET /api/products/categories` - Distinct categories list.
- `POST /api/products` - Register new product. *(Roles: ADMIN, WAREHOUSE)*
- `GET /api/products/:id` - Product details.
- `PUT /api/products/:id` - Update product details. *(Roles: ADMIN, WAREHOUSE)*

### Stock Movements
- `GET /api/stock-movements` - View inventory movement audit ledger. *(Roles: ADMIN, WAREHOUSE)*
- `POST /api/stock-movements/adjust` - Manual intake or write-off. *(Roles: ADMIN, WAREHOUSE)*

### Sales Challans
- `GET /api/challans` - List sales challans with search and status filtering.
- `POST /api/challans` - Create challan (saves as DRAFT or CONFIRMED). *(Roles: ADMIN, SALES)*
- `GET /api/challans/:id` - Challan details with frozen snapshot line items.
- `PUT /api/challans/:id/confirm` - Atomically verify stock, deduct inventory, and confirm. *(Roles: ADMIN, SALES)*
- `PUT /api/challans/:id/cancel` - Cancel challan. *(Roles: ADMIN, SALES)*

### Executive Dashboard & Administration
- `GET /api/dashboard/stats` - Total customers, products, low-stock count, draft/confirmed count, recent logs.
- `GET /api/users` - List portal users. *(Roles: ADMIN)*
- `POST /api/users` - Create portal user with specific role. *(Roles: ADMIN)*

---

## 7. Folder Structure

```
Mini-ERP/
├── backend/
│   ├── src/
│   │   ├── config/             # db.ts (pg pool), env.ts
│   │   ├── controllers/        # Express HTTP request handlers
│   │   ├── middleware/         # auth (JWT, RBAC), validation, centralized error handler
│   │   ├── repositories/       # Pure database SQL query layer
│   │   ├── routes/             # Express route declarations
│   │   ├── scripts/            # migrate.ts, seed.ts, test-flow.ts
│   │   ├── services/           # Business logic & transactional stock engine
│   │   ├── types/              # TypeScript domain types & express.d.ts
│   │   ├── utils/              # apiResponse, jwt, password, challanNumber generator
│   │   ├── validators/         # Input validation schemas
│   │   ├── app.ts              # Express application factory & CORS setup
│   │   └── server.ts           # Server bootstrap
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Select, Modal, Badge, Pagination, Loader, etc.
│   │   │   └── layout/         # Sidebar (RBAC + drawer), Navbar, AppLayout
│   │   ├── context/            # AuthContext (login, logout, session), ToastContext
│   │   ├── hooks/              # useAuth, useToast
│   │   ├── pages/              # Dashboard, Login, Customers, Products, Stock, Challans, Users
│   │   ├── routes/             # AppRoutes, ProtectedRoute (RBAC guard)
│   │   ├── services/           # Axios API client with JWT interceptor
│   │   ├── types/              # Frontend interfaces
│   │   ├── utils/              # Currency (INR) & date formatters
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── postman/
│   └── Mini_ERP_CRM_Postman_Collection.json # Ready-to-import API test collection
├── package.json                # Workspace runner scripts
└── README.md
```

---

## 8. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or v20+ recommended)
- PostgreSQL (v14 or higher)

### 1. Database Setup
Ensure PostgreSQL is running and create the database `mini_erp`:
```sql
CREATE DATABASE mini_erp;
```

### 2. Configure Backend Environment
In `backend/.env` (copy from `backend/.env.example`):
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_erp
JWT_SECRET=your_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
```
*(Note: If using cloud PostgreSQL like Neon, Supabase, or Render, simply paste the connection URL with `sslmode=require`).*

### 3. Install Dependencies
From the root directory:
```bash
npm run install:all
```
Or individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run Migration & Seed Data
```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Development Servers
In separate terminal tabs:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:frontend
```
Open `http://localhost:5173` in your browser.

---

## 9. Demo Credentials

Use these pre-seeded accounts to explore role-specific experiences (also available as **One-Click Demo Login** buttons directly on the Login page):

| Role | Email | Password | Permissions Summary |
|---|---|---|---|
| **ADMIN** | `admin@example.com` | `password123` | Full access to all modules, settings & user management |
| **SALES** | `sales@example.com` | `password123` | Customers CRM, Follow-ups, Product view, Create & Confirm Challans |
| **WAREHOUSE** | `warehouse@example.com` | `password123` | Product catalog, Inventory stock intake, Stock movements ledger, Challan view |
| **ACCOUNTS** | `accounts@example.com` | `password123` | Customer view, Challan view, Sales & pricing audit |

---

## 10. Testing Instructions

### Automated 18-Step Business Flow Verification
We provide an end-to-end integration test runner that executes the exact 18-step verification scenario:
```bash
npm run test:flow
```
The test verifies:
1. Sales login ➔ JWT returned.
2. Customer creation ➔ Returns 201.
3. Customer viewing ➔ Data asserted.
4. Customer follow-up note added ➔ History asserted.
5. Admin login ➔ Token returned.
6. Product created with stock = 10 ➔ Initial movement recorded.
7. Sales session active.
8. Challan created for quantity = 4 (Draft).
9. Product snapshot (name, SKU, price) frozen in `challan_items`.
10. Assert product stock remains 10 (Draft does not deduct).
11. Confirm challan ➔ Returns 200.
12. Assert product stock is reduced to 6.
13. Assert `OUT` stock movement of 4 exists.
14. Second challan created for quantity = 10.
15. Attempt confirmation.
16. Assert API rejects with HTTP 400: `"Insufficient stock for product... Available: 6, Requested: 10"`.
17. Assert product stock safely remains 6.
18. Assert no partial stock movements were created.
19. Boundary checks: Invalid login (401), unauthorized role (403), duplicate SKU (409), customer search and pagination.

---
## 11. Known Limitations & Future Improvements

- **Known Limitations**:
  - Currency is formatted for standard Indian Rupee (`₹` / `INR`) by default for wholesale distribution.
  - Deletion of customers or products with active historical challans is restricted via database foreign keys to prevent orphan transaction records.
- **Future Enhancements**:
  - Export Challans and stock movements to CSV/Excel formats.
  - Multi-warehouse transfer challans (moving stock from Bay A to Bay B).
  - WhatsApp/Email notifications to customers upon challan confirmation.
