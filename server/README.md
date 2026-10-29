# PantryPal Backend Guide

The backend is planned but has not been implemented yet. The current frontend runs independently and stores prototype data in `localStorage`.

## Required implementation

Use Node.js, Express.js, MongoDB, and Mongoose. The backend should provide:

- Owner and buyer registration
- Password hashing and login
- JWT authentication and role authorization
- Pantry/workspace management
- Inventory CRUD
- Member management
- Activity history
- Buyer cart/order requests
- Validation and centralized error handling

## Install dependencies

```powershell
cd C:\Users\vikas\Downloads\PantryPal\server
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

## Suggested package scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

## Suggested structure

```text
src/
├── config/db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── app.js
└── server.js
```

## Environment variables

Copy the repository `.env.example` file into the location used by your server configuration and provide real values for:

```text
PORT=5000
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Implementation order

1. Initialize Express and test `GET /api/health`.
2. Connect `mongoose` to MongoDB.
3. Create User, Pantry, InventoryItem, Member, Activity, and Order models.
4. Implement registration with bcrypt password hashing.
5. Implement login and JWT creation.
6. Add authentication middleware and role checks.
7. Implement pantry and inventory routes.
8. Implement member and activity routes.
9. Implement buyer order routes and inventory reservation checks.
10. Add validation, centralized errors, CORS, and rate limiting.
11. Connect the frontend API client.
12. Run owner, buyer, inventory, cart, and order integration tests.

## Core API endpoints

```text
POST   /api/auth/register-owner
POST   /api/auth/register-buyer
POST   /api/auth/login
GET    /api/auth/me

GET    /api/pantries/me
PATCH  /api/pantries/:id
GET    /api/pantries/:pantryId/items
POST   /api/pantries/:pantryId/items
PATCH  /api/items/:id
DELETE /api/items/:id

GET    /api/pantries/:pantryId/members
POST   /api/pantries/:pantryId/members
DELETE /api/members/:id
GET    /api/pantries/:pantryId/activity

GET    /api/items/available
POST   /api/orders
GET    /api/orders/mine
GET    /api/pantries/:pantryId/orders
PATCH  /api/orders/:id/status
```

## Authorization rules

- Owners can manage their own pantry and inventory.
- Buyers can browse available items and manage their own orders.
- Members should access only their authorized pantry.
- Authentication middleware must verify every protected route.
- Every owner or buyer action must verify database ownership or membership before updating records.

## Start the API after implementation

```powershell
cd C:\Users\vikas\Downloads\PantryPal\server
npm run dev
```

Then start the frontend separately and verify requests from `http://localhost:5173` to `http://localhost:5000`. Configure CORS for the frontend origin.
