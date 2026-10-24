# SevaSaathi Backend Setup

## Overview
This is the backend API server for SevaSaathi - Indian Blue-Collar Service Marketplace.

## Tech Stack
- **Node.js** with Express.js
- **MongoDB** (Mongoose ODM)
- **JWT** for authentication
- **Socket.IO** for real-time updates
- **bcryptjs** for password hashing

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file is already configured with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sevasaathi
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

4. Start MongoDB:
Make sure MongoDB is running on your system. On Windows, you can start it as a service or use MongoDB Atlas for cloud database.

5. Seed the database:
```bash
npm run seed
```

This will populate the database with:
- 10 service categories
- 8 workers with different skills
- 2 customers
- 1 admin account
- Sample bookings and reviews

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with phone, PIN, and role
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID

### Workers
- `GET /api/workers` - Get workers with filters (serviceId, pincode, available)
- `GET /api/workers/:id` - Get worker by ID
- `PUT /api/workers/:id` - Update worker profile
- `PATCH /api/workers/:id/availability` - Toggle availability
- `GET /api/workers/:id/bookings` - Get worker's bookings

### Customers
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer profile
- `POST /api/customers/:id/saved-workers` - Save/unsave worker
- `GET /api/customers/:id/bookings` - Get customer's bookings

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking by ID
- `PATCH /api/bookings/:id/accept` - Accept booking (worker)
- `PATCH /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/verify-arrival` - Verify arrival OTP
- `POST /api/bookings/:id/verify-completion` - Verify completion OTP
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/review` - Add rating and review

### Reviews
- `GET /api/reviews/worker/:workerId` - Get reviews for a worker
- `GET /api/reviews/customer/:customerId` - Get reviews by a customer
- `POST /api/reviews` - Create review

### Wallet
- `GET /api/wallets/balance` - Get wallet balance
- `GET /api/wallets/transactions` - Get transaction history
- `POST /api/wallets/credit` - Credit funds
- `POST /api/wallets/withdraw` - Withdraw funds

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/workers` - Get all workers for moderation
- `PATCH /api/admin/workers/:id/approve` - Approve worker
- `PATCH /api/admin/workers/:id/suspend` - Suspend worker
- `GET /api/admin/activity` - Get recent activity

### Disputes
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get all disputes (admin)
- `GET /api/disputes/:id` - Get dispute by ID
- `PATCH /api/disputes/:id/status` - Update dispute status

## Demo Accounts

### Customer
- Phone: 9811234567
- PIN: 1234

### Worker
- Phone: 9876543210
- PIN: 1234

### Admin
- Phone: 9000000000
- PIN: 0000

## Database Schema

### User (Base Model)
- name, phone, pin (hashed), role, city, pincode, avatarColor, initials

### Customer (extends User)
- savedWorkers, totalBookings

### Worker (extends User)
- skills, serviceId, hourlyRate, fixedRate, available, aadhaarVerified, experience, completedJobs, bio, languages, workingHours, location, rating, reviewCount, referralCode, walletBalance

### Service
- name, icon, color, description, basePrice, category

### Booking
- customerId, workerId, serviceId, status, date, time, address, pincode, budget, amount, requestCode, arrivalOTP, completionOTP, notes, rating, review

### Review
- bookingId, customerId, workerId, rating, comment

### WalletTransaction
- userId, type (credit/debit/withdrawal), amount, description, bookingId, balance

### Dispute
- bookingId, customerId, workerId, issue, status, priority, resolution, refundAmount

## Real-time Features

The server uses Socket.IO for real-time updates:
- Workers receive notifications when new bookings are created
- Customers receive updates when workers accept/decline bookings
- Both parties receive status updates during the booking process

## Frontend Integration

The frontend is configured to connect to the backend at `http://localhost:5000/api`. 
To change this, set the `VITE_API_URL` environment variable in the client's `.env` file.

## Troubleshooting

1. **MongoDB connection error**: Ensure MongoDB is running on localhost:27017
2. **Port already in use**: Change the PORT in .env file
3. **Seed script fails**: Drop the database and run seed again
