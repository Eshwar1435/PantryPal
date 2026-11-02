# PantryPal API Documentation

This document describes the complete REST API and Socket.IO real-time interface implemented in **PantryPal – Shared Pantry Tracker**.

---

## 1. Protocol & Security Overview

### Base URL
- Local Development: `http://localhost:5000`
- Configurable via `PORT` (backend) and `VITE_API_URL` (frontend)

### Authentication Mechanism
- Authentication uses a JSON Web Token (JWT) transmitted inside an `HttpOnly` cookie named `pantrypal_token`.
- Standard cookie attributes:
  - `httpOnly: true` (inaccessible to JavaScript)
  - `path: "/"`
  - `maxAge`: Derived from `JWT_COOKIE_EXPIRES_IN_DAYS` (default: 7 days)
  - `secure`: `true` in production (`NODE_ENV === "production"`), `false` in development
  - `sameSite`: `"none"` in production (for cross-origin deployments), `"lax"` in development

### CSRF & Origin Validation
For all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`), custom middleware checks the incoming `Origin` header against the configured `CLIENT_URL` (and allowed development aliases). Requests with unrecognized origins are rejected with `403 Request origin is not allowed`.

### Rate Limiting
Authentication endpoints (`/api/auth/register` and `/api/auth/login`) are protected by an in-memory rate limiter:
- Window: 15 minutes (`15 * 60 * 1000` ms)
- Limit: 10 requests per IP per window
- Exceeded response: `429 Too Many Requests` (returns `429` with JSON `{ success: false, message: "Too many authentication attempts. Please try again later." }`)

### Standard Response Envelope
All REST responses return JSON formatted as:

```json
{
  "success": true,
  "message": "Human-readable summary message",
  "...payload": "..."
}
```

Error responses follow the same pattern:

```json
{
  "success": false,
  "message": "Description of why the request failed"
}
```

---

## 2. API Endpoints Quick Reference

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service health status |
| `POST` | `/api/auth/register` | Public (Rate-limited) | Register a new user account |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Log in with email and password |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/preferences` | Authenticated | Get user notification preferences |
| `PATCH` | `/api/auth/preferences` | Authenticated | Update user notification preferences |
| `DELETE` | `/api/auth/account` | Authenticated | Permanently delete account and transfer pantries |
| `GET` | `/api/pantries` | Authenticated | List all pantries accessible to user |
| `POST` | `/api/pantries` | Authenticated | Create a new pantry |
| `DELETE` | `/api/pantries/:id` | Pantry Owner | Delete a pantry and all related data |
| `GET` | `/api/pantries/:id/members` | Pantry Member | List members of a specific pantry |
| `POST` | `/api/pantries/:id/members` | Pantry Owner | Add a registered user as a pantry member |
| `DELETE` | `/api/pantries/:id/members/:memberId` | Pantry Owner | Remove a member from a pantry |
| `GET` | `/api/inventory` | Authenticated | Get items across all accessible pantries |
| `GET` | `/api/pantries/:id/items` | Pantry Member | Get items for a single pantry |
| `POST` | `/api/pantries/:id/items` | Pantry Owner | Add an item to a pantry |
| `PATCH` | `/api/items/:id` | Pantry Owner | Update item details |
| `DELETE` | `/api/items/:id` | Pantry Owner | Delete an inventory item |
| `PATCH` | `/api/items/:id/quantity` | Pantry Member | Atomically adjust item stock quantity |
| `GET` | `/api/pantries/:id/activity` | Pantry Member | Get activity audit history for a pantry |

---

## 3. Detailed REST Endpoint Specifications

### Health Check

#### `GET /api/health`
Checks whether the API server is operational.

- **Access Level**: Public
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "PantryPal API is running"
  }
  ```

---

### Authentication & Account Management

#### `POST /api/auth/register`
Registers a new user and issues an authenticated session cookie.

- **Access Level**: Public (Rate-limited: 10 per 15 min)
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Validation Rules**:
  - `name`: Non-empty string.
  - `email`: Valid email format according to `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, lowercased.
  - `password`: Minimum 8 characters.
- **Success Response (`201 Created`)**:
  - Sets `pantrypal_token` HttpOnly cookie.
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user": {
      "id": "6724a1b2c3d4e5f678901234",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields, invalid email format, or password < 8 characters.
  - `409 Conflict`: An account with that email address already exists.

---

#### `POST /api/auth/login`
Authenticates an existing user and sets an authenticated session cookie.

- **Access Level**: Public (Rate-limited: 10 per 15 min)
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response (`200 OK`)**:
  - Sets `pantrypal_token` HttpOnly cookie.
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "6724a1b2c3d4e5f678901234",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing or malformed email/password.
  - `401 Unauthorized`: Invalid email or password.

---

#### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user based on the cookie.

- **Access Level**: Authenticated User
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "6724a1b2c3d4e5f678901234",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing, expired, or invalid session cookie.

---

#### `POST /api/auth/logout`
Clears the `pantrypal_token` session cookie.

- **Access Level**: Public
- **Success Response (`200 OK`)**:
  - Clears `pantrypal_token` cookie.
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

---

#### `GET /api/auth/preferences`
Fetches user notification preferences.

- **Access Level**: Authenticated User
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "preferences": {
      "lowStock": true,
      "expiry": true,
      "memberActivity": true
    }
  }
  ```

---

#### `PATCH /api/auth/preferences`
Updates one or more notification preferences for the user.

- **Access Level**: Authenticated User
- **Request Body**:
  ```json
  {
    "lowStock": false,
    "expiry": true,
    "memberActivity": false
  }
  ```
- **Validation Rules**:
  - At least one allowed key must be present (`lowStock`, `expiry`, `memberActivity`).
  - Provided values must be boolean.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "preferences": {
      "lowStock": false,
      "expiry": true,
      "memberActivity": false
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No valid keys supplied or non-boolean value passed.

---

#### `DELETE /api/auth/account`
Permanently deletes the user's account, transfers shared pantry ownership, deletes private pantries, and anonymizes activity history.

- **Access Level**: Authenticated User
- **Requirements**:
  - Requires a MongoDB deployment with transaction support (replica set or mongos). Standalone instances return `503 Service Unavailable`.
- **Request Body**:
  ```json
  {
    "password": "securepassword123",
    "confirmation": "DELETE",
    "ownershipTransfers": [
      {
        "pantryId": "6724b111c3d4e5f678909999",
        "newOwnerId": "6724a222c3d4e5f678908888"
      }
    ]
  }
  ```
- **Validation Rules**:
  - `password`: Must match user's current password.
  - `confirmation`: Must be exactly `"DELETE"`.
  - `ownershipTransfers`: Must be an array containing a valid transfer for every owned pantry that has other members. `newOwnerId` must be an existing member of that pantry (and not the departing user). Private pantries (no other members) are deleted automatically.
- **Side Effects**:
  - Shared pantries have ownership transferred to `newOwnerId`; departing user is removed from `memberIds`.
  - Private pantries, their `PantryItem` records, and their `InventoryActivity` entries are deleted.
  - User is removed from `memberIds` of all joined pantries.
  - Items created by the user have `createdBy` set to `null`.
  - Activities logged by the user have `userId` set to `null`.
  - User document is deleted from MongoDB.
  - Real-time events `pantry:ownership-transferred` and `pantry:member-removed` are emitted.
  - All active sockets for the departing user are forcibly disconnected.
  - Session cookie is cleared.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Your account was deleted successfully."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Password missing, confirmation is not `"DELETE"`, or invalid ownership transfer mappings.
  - `401 Unauthorized`: Password incorrect.
  - `503 Service Unavailable`: MongoDB deployment does not support transactions.

---

### Pantry Management

#### `POST /api/pantries`
Creates a new pantry space. The authenticated user is automatically set as owner and primary member.

- **Access Level**: Authenticated User
- **Request Body**:
  ```json
  {
    "name": "Kitchen Main Pantry"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Pantry created successfully",
    "pantry": {
      "_id": "6724b111c3d4e5f678909999",
      "name": "Kitchen Main Pantry",
      "ownerId": "6724a1b2c3d4e5f678901234",
      "memberIds": [
        "6724a1b2c3d4e5f678901234"
      ],
      "createdAt": "2026-11-01T10:15:00.000Z",
      "updatedAt": "2026-11-01T10:15:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Pantry name is missing or empty.

---

#### `GET /api/pantries`
Lists all pantries where the authenticated user is either the owner or a member.

- **Access Level**: Authenticated User
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "pantries": [
      {
        "_id": "6724b111c3d4e5f678909999",
        "name": "Kitchen Main Pantry",
        "ownerId": "6724a1b2c3d4e5f678901234",
        "memberIds": [
          "6724a1b2c3d4e5f678901234"
        ],
        "createdAt": "2026-11-01T10:15:00.000Z",
        "updatedAt": "2026-11-01T10:15:00.000Z"
      }
    ]
  }
  ```

---

#### `DELETE /api/pantries/:id`
Deletes a pantry along with its inventory items and activity history.

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Behavior**:
  - Uses a transaction when supported; otherwise uses an in-memory backup and rollback fallback.
  - Emits real-time event `pantry:deleted`.
  - Disconnects all sockets in the pantry room via `closePantryRoom`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Pantry and its inventory history were deleted successfully",
    "deletedPantryId": "6724b111c3d4e5f678909999"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid pantry ID format.
  - `403 Forbidden`: User is not the owner of this pantry.
  - `404 Not Found`: Pantry not found.

---

### Member Management

#### `GET /api/pantries/:id/members`
Retrieves the list of members belonging to a pantry with their resolved roles.

- **Access Level**: Pantry Member (Owner or Member)
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 2,
    "members": [
      {
        "id": "6724a1b2c3d4e5f678901234",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "Owner"
      },
      {
        "id": "6724a222c3d4e5f678908888",
        "name": "John Smith",
        "email": "john@example.com",
        "role": "Member"
      }
    ]
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: User does not have access to this pantry.
  - `404 Not Found`: Pantry not found.

---

#### `POST /api/pantries/:id/members`
Adds an existing registered user to the pantry by their email address.

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Validation Rules**:
  - Email must belong to an existing registered user in MongoDB.
  - Cannot add the pantry owner again.
  - Cannot add a user who is already a member of this pantry.
- **Side Effects**:
  - Emits real-time event `pantry:member-added`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Member added successfully",
    "member": {
      "id": "6724a222c3d4e5f678908888",
      "name": "John Smith",
      "email": "john@example.com"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing email or attempting to add the pantry owner.
  - `404 Not Found`: No registered user found with the given email.
  - `409 Conflict`: User is already a member of this pantry.

---

#### `DELETE /api/pantries/:id/members/:memberId`
Removes a member from a pantry.

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
  - `memberId`: MongoDB ObjectId of the user to remove.
- **Validation Rules**:
  - The pantry owner cannot be removed.
  - The user must currently be a member of the pantry.
- **Side Effects**:
  - Emits real-time event `pantry:member-removed`.
  - Revokes room access for that member's open sockets (`revokePantryAccess`), causing the client to receive `pantry:access-revoked`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Member removed successfully",
    "removedMemberId": "6724a222c3d4e5f678908888"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid member ID or attempting to remove the owner.
  - `403 Forbidden`: Authenticated user is not the owner.
  - `404 Not Found`: User is not a member of this pantry.

---

### Inventory Management

#### `GET /api/inventory`
Retrieves all inventory items across every pantry accessible to the authenticated user.

- **Access Level**: Authenticated User
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "items": [
      {
        "_id": "6724c333c3d4e5f678907777",
        "pantryId": "6724b111c3d4e5f678909999",
        "name": "Whole Milk",
        "category": "Dairy",
        "quantity": 2,
        "unit": "litres",
        "expiryDate": "2026-11-08T00:00:00.000Z",
        "lowStockThreshold": 1,
        "createdBy": "6724a1b2c3d4e5f678901234",
        "createdAt": "2026-11-01T10:30:00.000Z",
        "updatedAt": "2026-11-01T10:30:00.000Z",
        "pantryName": "Kitchen Main Pantry",
        "pantryOwnerId": "6724a1b2c3d4e5f678901234"
      }
    ]
  }
  ```

---

#### `GET /api/pantries/:id/items`
Retrieves items belonging to a specific pantry.

- **Access Level**: Pantry Member (Owner or Member)
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "items": [
      {
        "_id": "6724c333c3d4e5f678907777",
        "pantryId": "6724b111c3d4e5f678909999",
        "name": "Whole Milk",
        "category": "Dairy",
        "quantity": 2,
        "unit": "litres",
        "expiryDate": "2026-11-08T00:00:00.000Z",
        "lowStockThreshold": 1,
        "createdBy": "6724a1b2c3d4e5f678901234",
        "createdAt": "2026-11-01T10:30:00.000Z",
        "updatedAt": "2026-11-01T10:30:00.000Z"
      }
    ]
  }
  ```

---

#### `POST /api/pantries/:id/items`
Adds an inventory item to a pantry.

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Request Body**:
  ```json
  {
    "name": "Basmati Rice",
    "category": "Grains",
    "quantity": 5,
    "unit": "kg",
    "expiryDate": "2027-01-01",
    "lowStockThreshold": 2
  }
  ```
- **Validation Rules**:
  - `name`: Non-empty string.
  - `category`: Non-empty string, maximum 60 characters.
  - `quantity`: Finite number >= 0.
  - `unit`: Non-empty string.
  - `expiryDate`: ISO date string or `null`/empty.
  - `lowStockThreshold`: Finite number >= 0.
- **Side Effects**:
  - Records an `InventoryActivity` record (`action: "ITEM_ADDED"`, `changeAmount: quantity`).
  - Emits real-time event `inventory:item-added`.
  - Emits real-time event `activity:created`.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Inventory item added successfully",
    "item": {
      "_id": "6724c444c3d4e5f678906666",
      "pantryId": "6724b111c3d4e5f678909999",
      "name": "Basmati Rice",
      "category": "Grains",
      "quantity": 5,
      "unit": "kg",
      "expiryDate": "2027-01-01T00:00:00.000Z",
      "lowStockThreshold": 2,
      "createdBy": "6724a1b2c3d4e5f678901234",
      "createdAt": "2026-11-01T11:00:00.000Z",
      "updatedAt": "2026-11-01T11:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Field validation failure.
  - `403 Forbidden`: Authenticated user is not the pantry owner.

---

#### `PATCH /api/items/:id`
Updates item details (name, category, unit, quantity, expiryDate, lowStockThreshold).

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the item.
- **Request Body**: Partial update object with any of:
  ```json
  {
    "name": "Organic Basmati Rice",
    "lowStockThreshold": 3
  }
  ```
- **Side Effects**:
  - Records an `InventoryActivity` record (`action: "ITEM_EDITED"`, `changeAmount: 0`).
  - Emits real-time event `inventory:item-updated`.
  - Emits real-time event `activity:created`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Inventory item updated successfully",
    "item": {
      "_id": "6724c444c3d4e5f678906666",
      "name": "Organic Basmati Rice",
      "category": "Grains",
      "quantity": 5,
      "unit": "kg",
      "expiryDate": "2027-01-01T00:00:00.000Z",
      "lowStockThreshold": 3,
      "updatedAt": "2026-11-01T11:05:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Empty payload or validation error.
  - `403 Forbidden`: Authenticated user is not the pantry owner.
  - `404 Not Found`: Item not found.

---

#### `DELETE /api/items/:id`
Permanently deletes an inventory item.

- **Access Level**: Pantry Owner
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the item.
- **Side Effects**:
  - Records an `InventoryActivity` record (`action: "ITEM_DELETED"`).
  - Emits real-time event `inventory:item-deleted`.
  - Emits real-time event `activity:created`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Inventory item deleted successfully",
    "deletedItemId": "6724c444c3d4e5f678906666"
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Authenticated user is not the pantry owner.
  - `404 Not Found`: Item not found.

---

#### `PATCH /api/items/:id/quantity`
Atomically increases or decreases the quantity of an item.

- **Access Level**: Pantry Member (Both Owners and Members have permission)
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the item.
- **Request Body**:
  ```json
  {
    "change": 2
  }
  ```
  *(or `{ "change": -1 }` to decrement)*
- **Concurrency & Validation Rules**:
  - `change` must be a non-zero, finite number.
  - Atomic safeguard: uses MongoDB `$inc`. If `change < 0`, the query filter requires `quantity: { $gte: Math.abs(change) }`.
  - If a decrement would cause `quantity` to drop below zero, the query does not match and returns `409 Conflict`.
- **Side Effects**:
  - Records an `InventoryActivity` record (`action: "QUANTITY_INCREASED"` or `"QUANTITY_DECREASED"`, `changeAmount: change`).
  - Emits real-time event `inventory:quantity-updated`.
  - Emits real-time event `activity:created`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Inventory quantity updated successfully",
    "item": {
      "_id": "6724c444c3d4e5f678906666",
      "pantryId": "6724b111c3d4e5f678909999",
      "name": "Basmati Rice",
      "category": "Grains",
      "quantity": 7,
      "unit": "kg",
      "updatedAt": "2026-11-01T11:10:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `change` is missing, not a number, or zero.
  - `403 Forbidden`: Authenticated user does not belong to the item's pantry.
  - `409 Conflict`: Quantity cannot be reduced below zero.

---

### Activity History

#### `GET /api/pantries/:id/activity`
Retrieves the chronological audit log for a pantry, ordered newest first.

- **Access Level**: Pantry Member (Owner or Member)
- **URL Parameters**:
  - `id`: MongoDB ObjectId of the pantry.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 2,
    "activities": [
      {
        "_id": "6724e555c3d4e5f678905555",
        "pantryId": {
          "_id": "6724b111c3d4e5f678909999",
          "name": "Kitchen Main Pantry"
        },
        "itemId": {
          "_id": "6724c444c3d4e5f678906666",
          "name": "Basmati Rice"
        },
        "userId": {
          "_id": "6724a1b2c3d4e5f678901234",
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "changeAmount": 2,
        "action": "QUANTITY_INCREASED",
        "note": "Increased Basmati Rice quantity",
        "createdAt": "2026-11-01T11:10:00.000Z"
      }
    ]
  }
  ```
- **Note on Deleted Users**: If an actor's user account was deleted, `userId` is populated as `null`.

---

## 4. Socket.IO Real-Time Specification

The real-time layer provides bidirectional WebSocket communication with automatic HTTP long-polling fallback, room scoping per pantry, and handshake authentication.

### Handshake & Connection

- **Endpoint**: Connected to the root server origin (e.g., `http://localhost:5000`).
- **Authentication**: On connection handshake, Socket.IO middleware parses the incoming `Cookie` header for `pantrypal_token`. The JWT is verified using `JWT_SECRET`. If valid, `socket.data.userId` is initialized. If missing, invalid, or expired, the handshake is rejected with error `Authentication required`.

### Client-to-Server Events

#### `pantry:join`
Joins a specific pantry room to receive its inventory and member updates.

- **Parameters**: `pantryId` (string), `callback` (optional acknowledgement function)
- **Authorization**: The server checks MongoDB to confirm that `socket.data.userId` is listed in `pantry.memberIds`.
- **Acknowledgement / Callback**:
  - On Success: `callback({ success: true, pantryId })`
  - On Failure: Emits `pantry:join-rejected` to the socket and calls `callback({ success: false, message: "You do not have access to this pantry" })`

#### `pantry:leave`
Leaves a pantry room.

- **Parameters**: `pantryId` (string)
- **Behavior**: Calls `socket.leave("pantry:" + pantryId)`

---

### Server-to-Client Broadcast Events

Events are broadcast to room `pantry:<pantryId>`:

| Event Name | Scoping | Payload Schema | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `inventory:item-added` | Room | `{ pantryId, item: { _id, pantryId, name, category, quantity, unit, expiryDate, lowStockThreshold, createdAt, updatedAt } }` | Owner adds an item via `POST /api/pantries/:id/items` |
| `inventory:item-updated` | Room | `{ pantryId, item: { ... } }` | Owner updates item details via `PATCH /api/items/:id` |
| `inventory:item-deleted` | Room | `{ pantryId, itemId: string }` | Owner deletes an item via `DELETE /api/items/:id` |
| `inventory:quantity-updated` | Room | `{ pantryId, itemId: string, quantity: number, change: number, updatedAt: string }` | Member or Owner updates quantity via `PATCH /api/items/:id/quantity` |
| `pantry:member-added` | Room | `{ pantryId, memberId: string }` | Owner adds a member via `POST /api/pantries/:id/members` |
| `pantry:member-removed` | Room | `{ pantryId, memberId: string }` | Owner removes a member or user leaves via account deletion |
| `pantry:ownership-transferred`| Room | `{ pantryId, newOwnerId: string }` | Account deletion transfers ownership to a surviving member |
| `activity:created` | Room | `{ pantryId, activityId: string }` | An inventory mutation creates an activity record |
| `pantry:deleted` | Room | `pantryId: string` | Owner deletes pantry via `DELETE /api/pantries/:id` |
| `pantry:access-revoked` | Direct Socket | `{ pantryId: string }` | Emitted directly to the removed member's sockets after leaving the room |
| `pantry:join-rejected` | Direct Socket | `{ pantryId: string, success: false, message: string }` | Emitted when an unauthorized user attempts to join a pantry room |

