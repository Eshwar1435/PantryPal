const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class ActivityApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ActivityApiError';
    this.status = status;
  }
}

export const getPantryActivity = async pantryId => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/pantries/${encodeURIComponent(pantryId)}/activity`, {
      credentials: 'include',
    });
  } catch {
    throw new ActivityApiError('Unable to reach the PantryPal API. Check that the backend is running.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ActivityApiError(data.message || `Activity request failed (${response.status}).`, response.status);
  }
  return Array.isArray(data.activities) ? data.activities.map(activity => ({
    ...activity,
    id: activity._id || activity.id,
    user: activity.userId?.name || 'Unknown user',
    item: activity.itemId?.name || activity.note?.replace(/^Deleted item:\s*/i, '') || 'Deleted item',
    pantryName: activity.pantryId?.name || 'Unavailable pantry',
    time: activity.createdAt,
  })) : [];
};
