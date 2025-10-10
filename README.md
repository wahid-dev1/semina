# Medical POS System Backend

A comprehensive backend API for a Medical POS System built with NestJS, MongoDB, and Redis. This system enables Software Providers to manage Franchise Companies, each containing multiple Branches that handle employees, customers, services, and orders.

## 🏗️ Architecture

```
Software Provider
 └── Company (Franchise)
      ├── Branches
      │    ├── Employees
      │    ├── Customers
      │    ├── Orders
      │    ├── Services
      │    ├── Products
      │    ├── Subscriptions
      │    └── Settings
```

## 🚀 Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (sessions, QR codes, tokens)
- **Storage**: S3-compatible storage (files, 3D scans, logos)
- **Authentication**: JWT + One-time QR code
- **Email**: SMTP / SendGrid
- **API Format**: RESTful JSON

## 📋 Features

### Core Modules

1. **Companies** - Manage franchise-level data (Software Provider only)
2. **Branches** - Manage individual franchise branches with complex configuration
3. **Employees** - Branch-level POS users with role-based access control
4. **Customers** - Medical customers and related data
5. **Orders** - POS transactions and payment tracking
6. **Products** - Globally managed items/services
7. **Subscriptions** - Link products to franchise companies
8. **Medical Form** - Public customer registration via health intake form
9. **Dashboard** - Analytics and branch KPIs
10. **Auth** - Authentication and QR login
11. **Audit & Logs** - Track actions and access events

### Key Features

- **Multi-tenant Architecture**: Provider → Company → Branch hierarchy
- **Role-based Access Control**: Admin, Manager, Operator roles
- **QR Code Authentication**: One-time login for customers
- **Medical Form Integration**: Public customer registration
- **Real-time Analytics**: Dashboard with KPIs and metrics
- **Comprehensive Audit Logging**: Track all system actions
- **RESTful API**: Complete CRUD operations for all entities
- **Swagger Documentation**: Interactive API documentation

## 🛠️ Installation

### Prerequisites

- Node.js (v20.11+)
- MongoDB
- Redis
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medical-pos-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/medical-pos
   REDIS_URL=redis://localhost:6379

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # AWS S3
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=medical-pos-storage

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # App
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the application is running, visit:
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000

## 🔐 Authentication

### Employee Authentication
```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### QR Code Authentication
```bash
POST /auth/login-qr
{
  "qrCode": "abc123def456"
}
```

## 🏥 Medical Form Flow

1. Customer submits medical form at `/medical-form/submit`
2. System creates:
   - Customer record
   - Medical history
   - One-time QR code
3. Customer uses QR code to log in
4. QR code becomes invalid after first use

## 📊 Dashboard Analytics

The dashboard provides:
- Customer statistics
- Order and revenue metrics
- Product performance
- Employee activity
- Branch workload analysis
- Recent activity timeline

## 🔍 Audit & Logging

All system actions are logged including:
- CRUD operations
- Login/logout events
- Order processing
- Configuration changes
- User activities

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Employee login
- `POST /auth/login-qr` - QR code login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Companies
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /companies/:id` - Get company
- `PATCH /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

### Branches
- `GET /branches` - List branches
- `POST /branches` - Create branch
- `GET /branches/:id` - Get branch
- `PATCH /branches/:id` - Update branch
- `DELETE /branches/:id` - Delete branch

### Employees
- `GET /employees` - List employees
- `POST /employees` - Create employee
- `GET /employees/:id` - Get employee
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

### Customers
- `GET /customers` - List customers
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order
- `PATCH /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

### Products
- `GET /products` - List products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Dashboard
- `GET /dashboard/summary` - Get summary
- `GET /dashboard/branch-stats/:id` - Get branch stats
- `GET /dashboard/recent-logins` - Get recent logins

### Medical Form (Public)
- `POST /medical-form/submit` - Submit form
- `GET /medical-form/options` - Get form options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.
