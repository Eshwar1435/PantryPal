# PantryPal — Complete Project Guide

PantryPal is a shared pantry management application with separate Owner and Buyer portals. Owners manage inventory, workspace members, profiles, low-stock items, and expiry alerts. Buyers browse available stock, maintain a cart, and submit shopping requests.

## Project status

The complete React frontend is implemented. Data is currently stored in the browser with `localStorage` through `PantryContext`; changes are synchronized between tabs using the browser storage event. Authentication validates forms and navigates between pages, but there is no real login session yet. The Express and MongoDB backend has not been implemented in this repository.

| Area | Status | Storage |
|---|---|---|
| React UI and routing | Implemented | Browser |
| Owner features | Implemented as a frontend prototype | `localStorage` |
| Buyer features | Implemented as a frontend prototype | `localStorage` |
| Authentication | Form validation only | None |
| Backend API | Not implemented | MongoDB planned |
| Database | Not implemented | MongoDB planned |

## Technology stack

### Frontend

- React 18
- React Router DOM 6
- Vite 5
- Plain CSS
- Lucide React icons
- React Context API
- Browser `localStorage`

### Backend and database planned

- Node.js and Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for sessions
- bcrypt for password hashing
- CORS middleware

## Repository structure

```text
PantryPal/
├── client/
│   ├── src/
│   │   ├── components/       Shared navigation, layout, and inventory components
│   │   ├── context/          PantryProvider and shared application state
│   │   ├── data/             Mock inventory, activity, and member data
│   │   ├── pages/            Owner and buyer pages
│   │   ├── utils/            Frontend helper functions
│   │   ├── App.jsx           Application routes
│   │   ├── main.jsx          React entry point and providers
│   │   └── *.css             Application styles
│   ├── public/               Static assets
│   └── package.json
├── server/
│   └── README.md             Backend implementation guide
├── .env.example              Planned environment variables
├── .gitignore
└── README.md
```

## What has been completed

1. Created the React and Vite application.
2. Added owner and buyer portals.
3. Added owner login and registration screens with client-side validation.
4. Added buyer login and registration screens with client-side validation.
5. Added owner dashboard, inventory, low-stock, expiry, member, activity, profile, settings, and password pages.
6. Added buyer dashboard, shopping, requests/orders, profile, and settings pages.
7. Created shared inventory, cart, profile, member, workspace, and activity state in `PantryContext`.
8. Persisted frontend state in browser `localStorage`.
9. Added synchronization between browser tabs.
10. Added responsive styling for desktop and mobile screens.
11. Added inventory quantity reservations when buyers add items to a cart.

## Important frontend behavior

### Owner portal

- `/owner/login`: owner sign-in prototype.
- `/owner/register`: owner registration prototype.
- `/dashboard`: workspace summary and inventory overview.
- `/inventory`: add, edit, and remove pantry items.
- `/low-stock`: items below the configured low-stock threshold.
- `/expiry-alerts`: items approaching expiration.
- `/members`: view and manage workspace members.
- `/activity`: view inventory and cart activities.
- `/settings`: workspace settings.
- `/profile`: owner profile.

### Buyer portal

- `/buyer/login`: buyer sign-in prototype.
- `/buyer/register`: buyer registration prototype.
- `/buyer/dashboard`: buyer summary.
- `/buyer/shop`: browse stock and update the cart.
- `/buyer/requests`: view submitted request or order information.
- `/buyer/profile`: buyer profile.
- `/buyer/settings`: buyer settings.

### Current data keys

The frontend uses the following `localStorage` keys:

```text
pantrypal-inventory
pantrypal-aarav-cart
pantrypal-activities
pantrypal-members
pantrypal-owner-profile
pantrypal-buyer-profile
pantrypal-workspace-name
pantrypal-theme
```

These keys are suitable only for a prototype. Before production use, replace them with authenticated API requests to the backend.

**Current status:** UI-only base using hardcoded mock data (`client/src/data/mockData.js`). There is no backend, database, or real authentication yet. Login and Register only validate the form and navigate to `/pantries`.

## Prerequisites

Install the following before running or extending the project:

- Node.js 18 or newer
- npm 9 or newer
- MongoDB Community Server, or a MongoDB Atlas account
- Git
- A modern browser
- VS Code (recommended)

## Run the frontend

```powershell
cd C:\Users\vikas\Downloads\PantryPal\client
npm install
npm run dev
```

Vite normally starts the application at `http://localhost:5173`. Stop the server with `Ctrl+C`.

For a production frontend build:

```powershell
npm run build
npm run preview
```

## Backend requirements

The backend should be created in the `server/` directory with these minimum dependencies:

```text
express
mongoose
bcryptjs
jsonwebtoken
cors
dotenv
```

Recommended development dependencies:

```text
nodemon
```

A suitable backend package setup is:

```powershell
cd C:\Users\vikas\Downloads\PantryPal\server
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

Create `server/src/app.js` and `server/src/server.js`, then add folders for configuration, models, controllers, routes, middleware, and validation.

```text
server/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── inventoryController.js
│   │   ├── memberController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Pantry.js
│   │   ├── InventoryItem.js
│   │   ├── Member.js
│   │   ├── Activity.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── pantryRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── memberRoutes.js
│   │   └── orderRoutes.js
│   ├── app.js
│   └── server.js
├── package.json
└── README.md
```

## Database design

### User

Store `name`, normalized `email`, hashed `password`, role (`owner` or `buyer`), optional profile information, timestamps, and active status. Never store a raw password.

### Pantry or workspace

Store `name`, owner reference, invitation/membership identifiers, low-stock settings, and timestamps.

### InventoryItem

Store item name, category, quantity, unit, low-stock threshold, expiry date, image, pantry reference, and timestamps.

### Member

Store the user reference, pantry reference, role, and status.

### Activity

Store action, item reference, quantity change, user reference, pantry reference, and creation time.

### Order request

Store buyer reference, pantry reference, ordered item quantities, status, and timestamps. Recommended statuses are `pending`, `accepted`, `completed`, and `cancelled`.

## Required REST API

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register-owner` | Create an owner and workspace |
| POST | `/api/auth/register-buyer` | Create a buyer account |
| POST | `/api/auth/login` | Authenticate and return a JWT |
| GET | `/api/auth/me` | Return the current authenticated user |

### Pantries

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/pantries/me` | Get the owner's workspace |
| PATCH | `/api/pantries/:id` | Update workspace details |

### Inventory

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/pantries/:pantryId/items` | List inventory |
| POST | `/api/pantries/:pantryId/items` | Create an item |
| PATCH | `/api/items/:id` | Update an item |
| DELETE | `/api/items/:id` | Delete an item |

### Members and activity

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/pantries/:pantryId/members` | List members |
| POST | `/api/pantries/:pantryId/members` | Add or invite a member |
| DELETE | `/api/members/:id` | Remove a member |
| GET | `/api/pantries/:pantryId/activity` | List activity |

### Buyer orders

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/items/available` | Browse available items |
| POST | `/api/orders` | Submit cart contents |
| GET | `/api/orders/mine` | List the buyer's orders |
| GET | `/api/pantries/:pantryId/orders` | List owner requests |
| PATCH | `/api/orders/:id/status` | Update order status |

## Step-by-step backend and frontend integration

### 1. Prepare MongoDB

Start MongoDB locally, or create a MongoDB Atlas cluster. Add the database connection string to `.env`. Do not commit this file.

### 2. Configure the backend environment

Copy `.env.example` to `.env` and fill in the values:

```text
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pantrypal
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

Generate a strong secret rather than choosing a short dictionary word.

### 3. Connect to MongoDB

Create the database connection module and call it before listening on the Express port. Stop the process and report a connection error if MongoDB is unavailable.

### 4. Create schemas and indexes

Implement Mongoose models. Add unique indexes for normalized emails and compound indexes for pantry inventory and activity queries. Validate required fields and numeric minimum values.

### 5. Implement authentication

- Validate and normalize registration input.
- Check whether the email already exists.
- Hash passwords with bcrypt before saving.
- Compare passwords using bcrypt when logging in.
- Sign an access token containing the user ID and role.
- Return `401` for missing or invalid credentials.
- Protect routes using JWT middleware.
- Confirm that users can access only their own pantry and permitted actions.

### 6. Build inventory APIs

Owners should create, edit, and delete inventory items through protected routes. Calculate available quantity from stock after considering reserved quantities. Add activity entries for inventory changes. Return low-stock and expiry collections with targeted queries rather than loading everything and filtering in the browser.

### 7. Build member APIs

Validate each owner's membership before allowing member additions or removals. Save buyer roles and workspace association in MongoDB. Owners should be able to retrieve and manage their workspace members.

### 8. Build order APIs

Convert cart contents into an atomic order. Verify item availability, reserve quantities, create the order, and adjust inventory in the same database transaction where MongoDB transactions are available. Buyers should see only their orders; owners should see only orders for their workspace.

### 9. Create a frontend API layer

Add `client/src/services/api.js` with one configured fetch wrapper. Read `VITE_API_URL`, attach `Authorization: Bearer <token>`, parse JSON responses, and convert API errors into frontend-friendly messages.

```text
client/src/services/api.js
```

Do not expose the JWT secret in frontend code. Store only the short-lived token or an appropriate secure session mechanism in the browser.

### 10. Replace mock authentication

Update owner and buyer login/register screens to call the auth endpoints instead of only navigating. On success, save the received token and user, navigate to the correct dashboard, and add a shared auth context to protect private routes.

### 11. Replace localStorage data operations

Move inventory, cart, member, profile, activity, and order state from prototype-only `localStorage` operations to API calls. Keep `localStorage` only for non-sensitive UI preferences such as theme and, optionally, the session token.

### 12. Add loading and error states

Every API screen should handle loading, empty, network-error, validation-error, unauthorized, forbidden, and success states. Unauthorized requests should clear the session and redirect to the portal.

### 13. Test the complete flow

Run these scenarios:

1. Register an owner.
2. Sign out and sign in with the owner account.
3. Create inventory items.
4. Update and delete inventory items.
5. Register a buyer.
6. Browse available stock as the buyer.
7. Add items to the cart.
8. Submit an order.
9. Confirm stock reservation and activity entries.
10. Approve or complete the order as the owner.
11. Refresh both browser sessions and verify persistence.
12. Test invalid passwords, duplicate emails, unauthorized routes, missing items, and insufficient stock.

### 14. Deploy

A common deployment layout is:

- Deploy the Vite frontend to a static host or Azure Static Web Apps.
- Deploy Express as a Node web service or Azure App Service.
- Use MongoDB Atlas for the database.
- Set all environment variables in the production host.
- Configure the frontend API URL to the deployed HTTPS backend.
- Configure the backend CORS origin to the deployed frontend URL.
- Use HTTPS for both frontend and backend.

## Security checklist

- Never commit `.env`, database credentials, JWT secrets, or tokens.
- Hash passwords and never return password fields in API responses.
- Validate request bodies on the server; frontend validation is not sufficient.
- Use JWT expiry and authorization middleware.
- Restrict owner and buyer actions by role and pantry ownership.
- Configure CORS explicitly rather than allowing every origin in production.
- Limit request body size and use rate limiting on authentication routes.
- Sanitize errors and avoid exposing internal database messages.
- Use parameterized Mongoose operations and object ownership checks.
- Do not persist sensitive profile information in browser logs or screenshots.

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```text
PORT=5000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

Vite reads variables beginning with `VITE_`. Never place a secret in a `VITE_*` variable because it becomes accessible to browser code. `.env` is already excluded by `.gitignore`.

## Team Git workflow

1. Never commit directly to `main`.
2. Pull the latest `main` before starting work.

```powershell
git checkout main
git pull origin main
git checkout -b feat/backend-auth
```

3. Make small commits with clear messages.
4. Push the branch and open a pull request.
5. Ask a teammate to review before merging.

## Troubleshooting

- **Frontend cannot connect to backend:** verify the backend is running, check `VITE_API_URL`, and restart Vite after changing `.env`.
- **CORS error:** add the exact frontend origin to backend CORS configuration.
- **MongoDB connection failed:** verify `MONGO_URI`, network access, database credentials, and whether MongoDB is running.
- **Login works locally but not after deployment:** verify HTTPS URLs, JWT configuration, and production environment variables.
- **Old frontend data remains:** clear the relevant `pantrypal-*` keys in browser developer tools; this is only prototype state.
- **Port already used:** change `PORT`, update `VITE_API_URL`, or stop the process using that port.
