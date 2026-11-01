# PantryPal

PantryPal is a shared pantry inventory tracker. Authenticated users can
create pantries, invite existing users, manage pantry-specific inventory,
review stock and expiry alerts, and inspect activity history.

## Stack

- React 18, React Router, Vite, and Lucide icons
- Node.js, Express, and Mongoose
- Local MongoDB
- JWT authentication stored in HttpOnly cookies

## Run locally

Create `.env` from `.env.example` and configure MongoDB and a JWT secret.
Then run the API and frontend in separate terminals:

```powershell
cd server
npm install
npm run dev
```

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The API health check is
`http://localhost:5000/api/health`.

For a production frontend bundle:

```powershell
cd client
npm run build
```

## Main behavior

- Every inventory request is scoped to the selected pantry on the backend.
- Owners can add, edit, and delete items and manage members.
- Members can view inventory and change quantities, but cannot edit item
  details or delete items.
- Quantity updates are atomic and cannot reduce stock below zero.
- Activity entries record the authenticated user, pantry, item, and action.
- Low-stock and expiry views use the selected pantry's inventory.

The application has one common account flow. It does not contain Buyer
authentication, shopping carts, orders, or reservation functionality.
