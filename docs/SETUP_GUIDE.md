# PantryPal Setup & Installation Guide

This guide walks through configuring, installing, running, and troubleshooting **PantryPal – Shared Pantry Tracker** for local development and production deployment.

---

## 1. System Requirements & Prerequisites

Before starting, ensure the following software is installed on your system:

| Tool | Recommended Version | Minimum Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | v20.x or v18.x LTS | v18.0.0 | Required for both backend and frontend |
| **npm** | v9.x or v10.x | v8.0.0 | Included with Node.js |
| **MongoDB** | v7.0.x or v6.0.x | v5.0.0 | Local service or MongoDB Atlas cluster |
| **Git** | v2.30+ | — | For version control and repository cloning |

---

## 2. Repository Architecture & Layout

PantryPal is structured as an npm multi-package project containing two primary subprojects:
- `server/`: Express + Node.js backend API
- `client/`: React 18 + Vite frontend single-page application

> [!NOTE]
> There is no root `package.json`. Commands (`npm install`, `npm run dev`) must be executed inside the respective `server` or `client` directories.

---

## 3. Environment Configuration

The application uses two separate environment configuration files:
1. `server/.env` (Backend settings)
2. `client/.env` (Frontend build & runtime settings)

> [!IMPORTANT]
> Never commit actual `.env` files, production database connection strings, or JWT signing secrets to version control. Both `.gitignore` and local file locks protect these files.

### Backend Environment Variables (`server/.env`)

Copy `server/.env.example` to create `server/.env`:

```powershell
# In PowerShell from project root:
Copy-Item server/.env.example server/.env
```

| Variable Name | Required | Default / Safe Example | Detailed Explanation |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | The TCP port on which the Express HTTP server listens. |
| `MONGO_URI` | **Required** | `mongodb://127.0.0.1:27017/pantrypal` | MongoDB connection URI. Can point to a local instance or a remote MongoDB Atlas cluster. |
| `JWT_SECRET` | Auto / Required | *(Leave blank in dev)* | Secret key used to sign and verify JWT authentication tokens. **In development**, if left blank, `server.js` automatically generates a secure 64-byte `base64url` secret and persists it into `server/.env`. **In production**, this must be explicitly set or the server will halt on startup. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Expiration window for JWT payload signature (e.g. `7d`, `24h`, `1h`). |
| `JWT_COOKIE_EXPIRES_IN_DAYS` | Optional | `7` | Lifetime of the `pantrypal_token` HttpOnly cookie in days. |
| `CLIENT_URL` | **Required** | `http://localhost:5173` | Allowed frontend origin for CORS and CSRF validation. Multiple origins can be specified as a comma-separated list (e.g., `http://localhost:5173,http://127.0.0.1:5173`). |

#### Safe Example: `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pantrypal
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN_DAYS=7
CLIENT_URL=http://localhost:5173
```

---

### Frontend Environment Variables (`client/.env`)

Copy `client/.env.example` to create `client/.env`:

```powershell
# In PowerShell from project root:
Copy-Item client/.env.example client/.env
```

| Variable Name | Required | Default / Safe Example | Detailed Explanation |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Required** | `http://localhost:5000` | The base URL of the backend API server. Used by Vite and client API services to dispatch HTTP requests and establish the Socket.IO connection. |

#### Safe Example: `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

---

## 4. Installation & Dependency Setup

Install dependencies for both projects separately:

### Step 1: Install Backend Dependencies
```powershell
cd server
npm install
cd ..
```

### Step 2: Install Frontend Dependencies
```powershell
cd client
npm install
cd ..
```

---

## 5. Running the Application Locally

To run the full stack during development, open two separate terminal windows.

### Terminal 1: Start the Backend Server
```powershell
cd server
npm run dev
```

- Uses `nodemon` to watch `src/server.js` and automatically reload on code changes.
- Expected terminal output:
  ```text
  [nodemon] 3.x.x
  [nodemon] to restart at any time, enter `rs`
  [nodemon] watching path(s): *.*
  [nodemon] starting `node src/server.js`
  MongoDB connected: 127.0.0.1
  PantryPal API running on port 5000
  ```

### Terminal 2: Start the Frontend Application
```powershell
cd client
npm run dev
```

- Starts the Vite development server.
- Expected terminal output:
  ```text
    VITE v5.x.x  ready in 250 ms

    ➜  Local:   http://localhost:5173/
    ➜  Network: use --host to expose
    ➜  press h + enter to show help
  ```

Once both processes are running, open **`http://localhost:5173`** in your browser.

---

## 6. Building and Running for Production

### Frontend Production Build
To compile optimized static assets:
```powershell
cd client
npm run build
```
This produces an optimized production bundle in `client/dist/`.

To preview the built static bundle locally:
```powershell
cd client
npm run preview
```

### Backend Production Execution
In production, start the Node.js process directly (without `nodemon`):
```powershell
cd server
npm start
```

> [!IMPORTANT]
> When `NODE_ENV=production` is set, `JWT_SECRET` must be non-empty in the environment or startup will terminate with an error. Additionally, cookies will be flagged with `secure: true; sameSite: none`, which requires HTTPS.

---

## 7. MongoDB Configuration & Multi-Document Transactions

PantryPal handles most operations (item CRUD, atomic quantity increments, member additions) with standard standalone MongoDB queries.

However, **atomic account deletion (`DELETE /api/auth/account`)** requires multi-document transactions to guarantee data consistency across users, pantries, items, and activity history.

### Standalone MongoDB vs. Replica Set Behavior:
- **Standalone Instance**:
  - Pantry CRUD, inventory tracking, alerts, and member management operate normally.
  - Deleting an individual pantry (`DELETE /api/pantries/:id`) uses a built-in application-level rollback fallback.
  - Full account deletion (`DELETE /api/auth/account`) will return `503 Service Unavailable` with message: *"Account deletion requires a MongoDB deployment with transaction support."*
- **Replica Set or MongoDB Atlas**:
  - Full transaction support is active.
  - Multi-document rollback guarantees that account deletion and pantry transfer occur atomically.

### Enabling a Local Single-Node Replica Set (Optional)
If you wish to test multi-document transactions locally:
1. Start your local MongoDB daemon with a replica set name:
   ```powershell
   mongod --dbpath <your-data-path> --replSet rs0
   ```
2. Open the MongoDB shell (`mongosh`) and initiate the replica set:
   ```javascript
   rs.initiate()
   ```
3. Update `server/.env`:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/pantrypal?replicaSet=rs0
   ```

---

## 8. Verification & Health Checks

### Check Backend Health
Run a `curl` request or open in your browser:
```powershell
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "PantryPal API is running"
}
```

### Test User Registration & Authentication
1. Navigate to `http://localhost:5173/register`.
2. Create an account with a name, valid email, and a password (minimum 8 characters).
3. Upon registration, you will be redirected to `/dashboard`.
4. Check your browser cookies in Developer Tools: verify that `pantrypal_token` is present with `HttpOnly` enabled.

---

## 9. Troubleshooting Guide

### 1. Port 5000 or 5173 Already in Use
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`
- **Solution**: Identify the process using the port and terminate it, or change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env`:
  ```powershell
  # Find process listening on port 5000 (Windows PowerShell)
  Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```

### 2. MongoDB Connection Failed (`MongoServerSelectionError`)
- **Symptom**: `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`
- **Solution**: Ensure your local MongoDB service is running:
  ```powershell
  # Windows Services check
  Get-Service -Name MongoDB
  Start-Service -Name MongoDB
  ```

### 3. Request Origin Is Not Allowed (403 Forbidden)
- **Symptom**: State-changing requests (`POST`, `PATCH`, `DELETE`) fail with `403 Request origin is not allowed`.
- **Solution**: The backend checks the `Origin` header against `CLIENT_URL`. Verify that `CLIENT_URL` in `server/.env` matches your browser URL exactly (e.g. `http://localhost:5173`). If using an alternate hostname, add it to `CLIENT_URL` separated by a comma (e.g. `http://localhost:5173,http://127.0.0.1:5173`).

### 4. Session Expired or Immediate Redirect to Login
- **Symptom**: Navigating to dashboard immediately redirects to `/login` with `sessionExpired: true`.
- **Solution**:
  - Ensure cookies are allowed in your browser for `localhost`.
  - Check that the server clock and system time are synchronized.
  - If testing over non-localhost HTTP with `NODE_ENV=production`, the browser will drop cookies marked `secure: true`. Ensure `NODE_ENV` is not set to `production` during plain HTTP development.

### 5. Account Deletion Returns 503 Service Unavailable
- **Symptom**: Clicking "Delete account" in Settings displays *"Account deletion requires a MongoDB deployment with transaction support."*
- **Solution**: Standalone MongoDB does not support transactions. To use account deletion, switch your `MONGO_URI` to a MongoDB Atlas cluster or initiate a local replica set (see Section 7).

### 6. Real-Time Updates Not Reflecting in Other Tabs
- **Symptom**: Quantities or items modified in one browser window do not immediately appear in another.
- **Solution**:
  - Open Developer Tools -> Network tab and check the `socket.io` connection. It should show a 101 Switching Protocols (WebSocket) or continuous polling with status 200.
  - Verify that both tabs are logged into accounts that belong to the **same pantry**. Real-time events are strictly isolated to pantry-specific rooms (`pantry:<pantryId>`).

