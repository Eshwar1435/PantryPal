# PantryPal API

The backend is an Express and MongoDB API for the shared pantry tracker. It
uses JWTs in HttpOnly cookies and authorizes every pantry operation against
the authenticated user's membership.

## Run locally

From the `server` directory:

```powershell
npm install
npm run dev
```

The API listens on `http://localhost:5000`. MongoDB must be running locally
and the repository `.env` file must contain the values described in
`.env.example`.

## Implemented routes

```text
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/pantries
POST   /api/pantries
GET    /api/pantries/:id/members
POST   /api/pantries/:id/members
DELETE /api/pantries/:id/members/:memberId

GET    /api/pantries/:id/items
POST   /api/pantries/:id/items
PATCH  /api/items/:id
DELETE /api/items/:id
PATCH  /api/items/:id/quantity
GET    /api/pantries/:id/activity
```

Pantry item listing and activity history require pantry membership. Adding,
editing, and deleting item details and managing members require pantry
ownership. Members may still increase or decrease quantities.

## Environment

Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET`, and the
frontend origin. Never commit `.env`.
