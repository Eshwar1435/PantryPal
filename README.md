# PantryPal: Shared Pantry Tracker

A shared inventory app for households, hostels, offices, or teams. Members can track ingredients and supplies, update quantities, and spot low-stock or soon-to-expire items.

**Tech stack:** React (Vite), react-router-dom, plain CSS (frontend); Node.js, Express.js, MongoDB (backend, not built yet).

**Current status:** UI-only base using hardcoded mock data (`client/src/data/mockData.js`). There is no backend, database, or real authentication yet. Login and Register only validate the form and navigate to `/pantries`.

## Run the client

```bash
cd client
npm install
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

## Folder structure

```
pantrypal/
├── client/                React + Vite app
│   └── src/
│       ├── components/    Navbar, ItemTable, ItemForm, StatusBadge
│       ├── pages/         Login, Register, PantryList, PantryDashboard, Members, Activity
│       ├── data/          mockData.js (all mock data)
│       ├── App.jsx        routes
│       ├── main.jsx       entry point
│       └── index.css      single stylesheet
├── server/                Backend placeholder (Express + MongoDB, to be built)
├── .env.example           environment variable placeholders
├── .gitignore
└── README.md
```

## Team Git workflow

1. **Never commit directly to `main`.**
2. Pull the latest `main` before starting work: `git checkout main && git pull`.
3. Create a branch for your work, for example `feat/auth-backend`, `feat/inventory-api`, or `feat/ui-polish`.
4. Make small, regular commits with clear messages.
5. Push your branch and open a pull request. Get a teammate to review before merging.

## Environment variables

Copy `.env.example` to `.env` and fill in the values. **`.env` must never be committed** (it is already in `.gitignore`).
