# Medical POS System Backend API

A comprehensive backend API for a Medical POS System built with NestJS, MongoDB, and Redis. This system enables Software Providers to manage Franchise Companies with multiple Branches, each handling employees, customers, orders, and medical data.

## 🏗️ System Architecture

```
Software Provider
 └── Franchise Company
      ├── Branches
      │    ├── Employees
      │    ├── Customers
      │    ├── Orders
      │    ├── Services
      │    ├── Products
      │    ├── Subscriptions
      │    └── Branch Settings
```

## 🚀 Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (for QR session and tokens)
- **Storage**: S3-compatible (for 3D scans, files)
- **Authentication**: JWT + One-time QR Code
- **Email**: SMTP / SendGrid
- **API Format**: RESTful JSON

## 📋 Features

### Core Modules

1. **Authentication & Authorization**
   - JWT-based authentication
   - One-time QR code login for customers
   - Role-based access control (RBAC)
   - Session management with Redis

2. **Branch Management**
   - Complete branch configuration
   - Opening hours management
   - Services and resources tracking
   - App settings and policies

3. **Employee Management**
   - Multi-role employee system (Admin, Manager, Operator)
   - Password management
   - Branch-specific access control

4. **Customer Management**
   - Medical customer profiles
   - Medical history tracking
   - QR code generation for login

5. **Order Management**
   - POS transaction handling
   - Payment method tracking
   - Order status management
   - Analytics and reporting

6. **Product & Subscription Management**
   - Global product catalog
   - Branch-specific products
   - Franchise subscriptions

7. **Medical Form System**
   - Comprehensive medical history forms
   - One-time QR code generation
   - Terms and conditions handling

8. **Dashboard & Analytics**
   - Real-time metrics
   - Branch performance tracking
   - Customer activity monitoring
   - Revenue analytics

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medical-pos-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
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
- **Swagger UI**: http://localhost:3000/api
- **API Base URL**: http://localhost:3000

## 🔐 Authentication

### Employee Login
```bash
POST /auth/login
{
  "email": "employee@example.com",
  "password": "password123"
}
```

### Customer QR Login
```bash
POST /auth/login-qr
{
  "qrCode": "generated-qr-code-string"
}
```

### Token Refresh
```bash
POST /auth/refresh
{
  "refreshToken": "your-refresh-token"
}
```

## 🏢 Branch Management

### Create Branch
```bash
POST /branches
{
  "branchName": "WellCare Berlin",
  "contactPerson": "Dr. Anna Meier",
  "address": "Kurfürstendamm 123, 10711 Berlin, Germany",
  "phone": "+49 30 123456",
  "email": "berlin@wellcare.com",
  "timezone": "Europe/Berlin",
  "openingHours": [
    {
      "day": "monday",
      "open": "08:00",
      "close": "18:00",
      "isClosed": false
    }
  ],
  "services": [
    {
      "name": "Cryotherapy",
      "type": "treatment",
      "maxResource": 3,
      "resourceUsed": 1,
      "active": true
    }
  ],
  "appSettings": {
    "logoUrl": "https://cdn.example.com/berlin-logo.png",
    "appInvitationMessage": "Welcome to WellCare!",
    "appGiftMessage": "Enjoy your first session on us!"
  },
  "cancellationPolicy": {
    "periodHours": 24,
    "penaltyApplicable": true
  },
  "calendarSettings": {
    "timeIntervalMinutes": 30,
    "allowMultiServiceBooking": true
  },
  "enabled": true,
  "visibleToOthers": false,
  "companyId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

## 👥 Employee Management

### Create Employee
```bash
POST /employees
{
  "username": "john_doe",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "personalPin": "1234",
  "branchId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "enabled": true,
  "role": "admin",
  "language": "en"
}
```

## 🏥 Medical Form Submission

### Submit Medical Form
```bash
POST /medical-form/submit
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St, City, Country",
  "branchId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "fieldOfApplication": "health",
  "isPregnant": false,
  "diseases": ["Diabetes", "Hypertension"],
  "healthIssues": ["Chronic Pain"],
  "drugsAndImplants": ["Insulin"],
  "termsAccepted": true,
  "signature": "John Doe",
  "additionalNotes": "Regular checkups needed"
}
```

## 📊 Dashboard Analytics

### Get Summary
```bash
GET /dashboard/summary?branchId=60f7b3b3b3b3b3b3b3b3b3b3
```

### Get Branch Stats
```bash
GET /dashboard/branch-stats
```

### Get Workload Analysis
```bash
GET /dashboard/workload?branchId=60f7b3b3b3b3b3b3b3b3b3b3
```

## 🔒 Role-Based Access Control

- **Admin**: Full system access, can manage all branches and employees
- **Manager**: Limited admin rights, can manage their branch
- **Operator**: POS and orders only, limited customer management

## 📝 Database Collections

| Collection | Description |
|------------|-------------|
| `providers` | Software providers (root admins) |
| `companies` | Franchise companies |
| `branches` | Branch info + configurations |
| `employees` | Branch employees |
| `customers` | Medical customers |
| `orders` | Customer transactions |
| `products` | Items or services |
| `subscriptions` | Franchise subscriptions |
| `medical_histories` | Full medical forms |
| `qrcodes` | One-time login codes |
| `sessions` | Active user sessions |

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the application**
   ```bash
   npm run start:prod
   ```

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team.
