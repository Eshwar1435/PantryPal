const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class PantryApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'PantryApiError';
    this.status = status;
  }
}

const mapPantry = pantry => ({
  ...pantry,
  id: pantry._id,
  memberIds: Array.isArray(pantry.memberIds) ? pantry.memberIds : [],
});

const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof PantryApiError) throw error;
    throw new PantryApiError('Unable to reach the PantryPal API. Check that the backend is running and VITE_API_URL is correct.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PantryApiError(data.message || `Pantry request failed (${response.status}).`, response.status);
  }

  return data;
};

export const listPantries = async () => {
  const data = await request('/api/pantries');
  return Array.isArray(data.pantries) ? data.pantries.map(mapPantry) : [];
};

export const createPantry = async name => {
  const data = await request('/api/pantries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!data.pantry) throw new PantryApiError('The PantryPal API did not return the created pantry.');
  return mapPantry(data.pantry);
};

export const deletePantry = async pantryId => request(
  `/api/pantries/${encodeURIComponent(pantryId)}`,
  { method: 'DELETE' }
);



export const getPantryMembers = async (pantryId) => {
  const data = await request(
    `/api/pantries/${encodeURIComponent(pantryId)}/members`
  );

  return Array.isArray(data.members) ? data.members : [];
};

export const addPantryMember = async (pantryId, email) => {
  return request(
    `/api/pantries/${encodeURIComponent(pantryId)}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }
  );
};

export const removePantryMember = async (pantryId, memberId) => {
  return request(
    `/api/pantries/${encodeURIComponent(pantryId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: "DELETE",
    }
  );
};
