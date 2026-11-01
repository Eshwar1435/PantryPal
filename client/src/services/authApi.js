const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class AuthApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthApiError';
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
    throw new AuthApiError('Unable to reach the PantryPal API. Please try again.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthApiError(data.message || 'Authentication request failed.', response.status);
  return data;
};

export const register = (payload) => request('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const login = (payload) => request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const getCurrentUser = () => request('/api/auth/me', { method: 'GET' });

export const logout = () => request('/api/auth/logout', { method: 'POST' });
