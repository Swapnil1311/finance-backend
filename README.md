# Finance Data Processing & Access Control Backend

A REST API for managing financial records with role-based access control, built with Node.js, Express, and MongoDB.

---

## Tech Stack

| Layer      | Technology                               |
| ---------- | ---------------------------------------- |
| Runtime    | Node.js                                  |
| Framework  | Express.js                               |
| Database   | MongoDB (via Mongoose ODM)               |
| Auth       | JWT (jsonwebtoken) + bcrypt              |
| Validation | express-validator                        |
| Docs       | Swagger UI (OpenAPI 3.0)                 |
| Security   | Rate limiting, CORS, payload size limits |

---

## Project Structure

```
finance-backend/
├── app.js                     # Entry point: middleware, routes, server
├── .env                       # Environment variables (never commit this)
├── config/
│   ├── db.js                  # MongoDB connection with event logging
│   └── swagger.js             # OpenAPI 3.0 spec and schema definitions
├── models/
│   ├── RoleModel.js           # viewer / analyst / admin with permissions
│   ├── UserModel.js           # User with JWT methods, bcrypt hooks, soft delete
│   └── TransactionModel.js    # Financial record with indexes and soft delete
├── controllers/
│   ├── AuthController.js      # register, login, getMe, changePassword
│   ├── RoleController.js      # seed + CRUD for roles
│   ├── UserController.js      # admin user management
│   ├── TransactionController.js # full CRUD + filters + pagination + soft delete
│   └── DashboardController.js # MongoDB aggregation pipelines for analytics
├── routes/
│   ├── AuthRoutes.js
│   ├── RoleRoutes.js
│   ├── UserRoutes.js
│   ├── TransactionRoutes.js
│   └── DashboardRoutes.js
├── middlewares/
│   ├── authMiddleware.js      # JWT verification, attaches req.user
│   ├── rbacMiddleware.js      # requirePermission, requireRole, isOwnerOrAdmin
│   ├── errorMiddleware.js     # Global error handler + 404 catcher
│   ├── rateLimiter.js         # express-rate-limit (global + auth-specific)
│   └── validate.js            # express-validator result checker
├── validators/
│   └── index.js               # All validator chains (register, login, transaction…)
└── utils/
    └── responseHelper.js      # successResponse, errorResponse, pagination helpers
```

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB Atlas (local) running on `mongodb://127.0.0.1:27017`

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/finance_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Seed the roles (required first step)

```bash
# Start the server, then call:
POST http://localhost:5000/api/roles/seed
```

This creates the three default roles: `viewer`, `analyst`, `admin`.

### 4. Register an admin user

```bash
POST http://localhost:5000/api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin123",
  "roleName": "admin"
}
```

### 5. Start the server

```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Interactive Docs (Swagger UI)

```
http://localhost:5000/api-docs
```

Authorize with your JWT token in Swagger: click **Authorize** → enter `Bearer <your_token>`

### Health Check

```
GET http://localhost:5000/health
```

---

## Endpoints

### Auth — `/api/auth`

| Method | Endpoint           | Access  | Description        |
| ------ | ------------------ | ------- | ------------------ |
| POST   | `/register`        | Public  | Register new user  |
| POST   | `/login`           | Public  | Login, returns JWT |
| GET    | `/me`              | Private | Get own profile    |
| PUT    | `/change-password` | Private | Change password    |

### Roles — `/api/roles`

| Method | Endpoint | Access | Description                   |
| ------ | -------- | ------ | ----------------------------- |
| POST   | `/seed`  | Public | Seed default roles (run once) |
| GET    | `/`      | Admin  | List all roles                |
| GET    | `/:id`   | Admin  | Get role by ID                |
| POST   | `/`      | Admin  | Create custom role            |
| PUT    | `/:id`   | Admin  | Update role                   |
| DELETE | `/:id`   | Admin  | Delete role                   |

### Users — `/api/users`

| Method | Endpoint      | Access | Description                        |
| ------ | ------------- | ------ | ---------------------------------- |
| GET    | `/`           | Admin  | List users (paginated, searchable) |
| GET    | `/:id`        | Admin  | Get user by ID                     |
| PUT    | `/:id/role`   | Admin  | Assign role to user                |
| PUT    | `/:id/status` | Admin  | Toggle active/inactive             |
| DELETE | `/:id`        | Admin  | Soft delete user                   |

### Transactions — `/api/transactions`

| Method | Endpoint       | Access               | Description                             |
| ------ | -------------- | -------------------- | --------------------------------------- |
| GET    | `/categories`  | All                  | List valid categories                   |
| GET    | `/`            | All (read)           | List with filters + pagination + search |
| POST   | `/`            | Analyst, Admin       | Create transaction                      |
| GET    | `/:id`         | All (read)           | Get by ID                               |
| PUT    | `/:id`         | Analyst (own), Admin | Update transaction                      |
| DELETE | `/:id`         | Admin                | Soft delete                             |
| GET    | `/deleted`     | Admin                | View deleted (recycle bin)              |
| PUT    | `/:id/restore` | Admin                | Restore deleted                         |

### Dashboard — `/api/dashboard`

| Method | Endpoint         | Access     | Description                                  |
| ------ | ---------------- | ---------- | -------------------------------------------- |
| GET    | `/overview`      | All (read) | All metrics in one request                   |
| GET    | `/summary`       | All (read) | Total income, expense, balance, savings rate |
| GET    | `/by-category`   | All (read) | Breakdown by category with % share           |
| GET    | `/monthly-trend` | All (read) | Month-by-month trend for a year              |
| GET    | `/recent`        | All (read) | Latest N transactions                        |
| GET    | `/top-expenses`  | All (read) | Top spending categories                      |

---

## Role & Permission System

| Role    | read | write | delete | manage_users |
| ------- | ---- | ----- | ------ | ------------ |
| viewer  | ✅   | ❌    | ❌     | ❌           |
| analyst | ✅   | ✅    | ❌     | ❌           |
| admin   | ✅   | ✅    | ✅     | ✅           |

**Additional rules:**

- Analysts can only update their **own** transactions
- Admins can update/delete **any** transaction
- Admins cannot deactivate or delete themselves
- All financial deletes are **soft deletes** — records are never permanently removed (audit trail)

---

## Transaction Filters (GET /api/transactions)

| Param       | Type     | Description                                 |
| ----------- | -------- | ------------------------------------------- |
| `page`      | integer  | Page number (default: 1)                    |
| `limit`     | integer  | Items per page (default: 10, max: 100)      |
| `type`      | string   | `income` or `expense`                       |
| `category`  | string   | e.g. `salary`, `rent`, `food`               |
| `startDate` | ISO date | Filter from date                            |
| `endDate`   | ISO date | Filter to date                              |
| `minAmount` | number   | Minimum amount                              |
| `maxAmount` | number   | Maximum amount                              |
| `search`    | string   | Full-text search (title, description, tags) |
| `tags`      | string   | Comma-separated: `monthly,q1`               |
| `sortBy`    | string   | `date`, `amount`, `createdAt`, `title`      |
| `sortOrder` | string   | `asc` or `desc`                             |

---

## Key Design Decisions & Tradeoffs

### Soft Delete over Hard Delete

Financial records must never be permanently removed. Soft delete (`isDeleted: true`) preserves the audit trail while keeping records out of normal queries via Mongoose pre-find middleware. Tradeoff: slightly more complex restore logic and DB storage grows over time (acceptable for finance).

### JWT over Sessions

Stateless JWT tokens are better suited for a frontend-agnostic API (React, mobile, etc.). No server-side session store needed. Tradeoff: tokens can't be invalidated before expiry without a token blacklist (omitted here for scope, but `lastLogin` tracking is in place as a foundation).

### MongoDB Indexes

Compound and single-field indexes on `date`, `type`, `category`, and `createdBy` ensure fast filtering on large datasets. Text index enables full-text search without a separate search service.

### Permission-based vs Role-based

Both layers are implemented. `requirePermission('write')` is more flexible than `requireRole('analyst', 'admin')` — if you add a new role in the future, you only update its permissions, not every route.

### Parallel Aggregations on Dashboard

`/api/dashboard/overview` runs 4 MongoDB aggregations concurrently using `Promise.all()`. This reduces response time from ~4× serial latency to the slowest single query.

---
