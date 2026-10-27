// All hardcoded mock data lives here. Replace with API calls later.

// Helper: date string (YYYY-MM-DD) N days from today, so expiry examples stay fresh.
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const categories = ['Grains', 'Dairy', 'Vegetables', 'Fruits', 'Spices', 'Snacks', 'Beverages', 'Other'];

export const currentUser = { id: 'u1', name: 'Tejesh', email: 'tejesh@example.com' };

// Mock flag: is the logged-in user the owner of the pantry? (controls owner-only UI)
export const isOwner = true;

export const pantries = [
  { id: 'p1', name: 'Hostel Room 204', ownerId: 'u1', memberIds: ['u1', 'u2', 'u3'] },
  { id: 'p2', name: 'Home Kitchen', ownerId: 'u2', memberIds: ['u1', 'u2'] },
];

export const items = [
  { id: 'i1', pantryId: 'p1', name: 'Basmati Rice', category: 'Grains', quantity: 5, unit: 'kg', expiryDate: daysFromNow(200), lowStockThreshold: 2 },
  { id: 'i2', pantryId: 'p1', name: 'Milk', category: 'Dairy', quantity: 2, unit: 'litres', expiryDate: daysFromNow(3), lowStockThreshold: 1 },
  { id: 'i3', pantryId: 'p1', name: 'Eggs', category: 'Dairy', quantity: 4, unit: 'pcs', expiryDate: daysFromNow(10), lowStockThreshold: 6 },
  { id: 'i4', pantryId: 'p1', name: 'Tomatoes', category: 'Vegetables', quantity: 1, unit: 'kg', expiryDate: daysFromNow(-2), lowStockThreshold: 1 },
  { id: 'i5', pantryId: 'p1', name: 'Turmeric Powder', category: 'Spices', quantity: 200, unit: 'g', expiryDate: daysFromNow(300), lowStockThreshold: 50 },
  { id: 'i6', pantryId: 'p1', name: 'Instant Noodles', category: 'Snacks', quantity: 12, unit: 'packs', expiryDate: daysFromNow(90), lowStockThreshold: 4 },
  { id: 'i7', pantryId: 'p2', name: 'Atta Flour', category: 'Grains', quantity: 3, unit: 'kg', expiryDate: daysFromNow(60), lowStockThreshold: 1 },
  { id: 'i8', pantryId: 'p2', name: 'Bananas', category: 'Fruits', quantity: 6, unit: 'pcs', expiryDate: daysFromNow(5), lowStockThreshold: 3 },
];

export const members = [
  { id: 'u1', name: 'Tejesh', email: 'tejesh@example.com', role: 'Owner' },
  { id: 'u2', name: 'Ananya', email: 'ananya@example.com', role: 'Member' },
  { id: 'u3', name: 'Rahul', email: 'rahul@example.com', role: 'Member' },
];

export const activity = [
  { id: 'a1', user: 'Ananya', item: 'Milk', changeAmount: -1, note: 'Used for tea', time: '2 hours ago' },
  { id: 'a2', user: 'Rahul', item: 'Eggs', changeAmount: -2, note: 'Breakfast', time: 'Yesterday' },
  { id: 'a3', user: 'Tejesh', item: 'Basmati Rice', changeAmount: 5, note: 'Bought a new bag', time: '2 days ago' },
  { id: 'a4', user: 'Ananya', item: 'Instant Noodles', changeAmount: -3, note: 'Late-night snack', time: '3 days ago' },
];
