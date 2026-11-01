export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

export const notifySessionExpired = () => {
  window.dispatchEvent(new CustomEvent('pantrypal:session-expired'));
};
