import { notifySessionExpired } from './session.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class InventoryApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'InventoryApiError';
    this.status = status;
  }
}

const request = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new InventoryApiError('Unable to reach the PantryPal API. Check that the backend is running.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) notifySessionExpired();
  if (!response.ok) {
    throw new InventoryApiError(data.message || `Inventory request failed (${response.status}).`, response.status);
  }
  return data;
};

const mapItem = item => ({
  ...item,
  id: item._id || item.id,
  expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : '',
});

export const getPantryItems = async pantryId => {
  const data = await request(`/api/pantries/${encodeURIComponent(pantryId)}/items`);
  return Array.isArray(data.items) ? data.items.map(mapItem) : [];
};

export const getGlobalItems = async () => {
  const data = await request('/api/inventory');
  return Array.isArray(data.items) ? data.items.map(mapItem) : [];
};

export const addPantryItem = async (pantryId, item) => {
  const data = await request(`/api/pantries/${encodeURIComponent(pantryId)}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return mapItem(data.item);
};

export const updatePantryItem = async (itemId, updates) => {
  const data = await request(`/api/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return mapItem(data.item);
};

export const deletePantryItem = async itemId => {
  return request(`/api/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
};

export const changePantryItemQuantity = async (itemId, change) => {
  const data = await request(`/api/items/${encodeURIComponent(itemId)}/quantity`, {
    method: 'PATCH',
    body: JSON.stringify({ change }),
  });
  return mapItem(data.item);
};
