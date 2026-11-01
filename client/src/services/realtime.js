import { io } from 'socket.io-client';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const events = [
  'inventory:item-added',
  'inventory:item-updated',
  'inventory:item-deleted',
  'inventory:quantity-updated',
  'pantry:member-added',
  'pantry:member-removed',
  'pantry:ownership-transferred',
  'activity:created',
  'pantry:deleted',
  'pantry:access-revoked',
];

let socket = null;
let pantryIds = [];
const listeners = new Map();

const notify = (event, detail) => {
  listeners.get(event)?.forEach(listener => listener(detail));
};

const joinPantries = () => {
  pantryIds.forEach(pantryId => socket?.emit('pantry:join', pantryId));
};

export const connectRealtime = () => {
  if (socket) return;
  socket = io(API_BASE_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
  });
  events.forEach(event => socket.on(event, detail => notify(event, detail)));
  socket.on('connect', () => {
    notify('realtime:status', { connected: true });
    joinPantries();
  });
  socket.on('disconnect', reason => notify('realtime:status', { connected: false, reason }));
  socket.on('connect_error', error => notify('realtime:error', { message: error.message }));
};

export const configureRealtimePantries = pantries => {
  pantryIds = pantries.map(pantry => String(pantry.id));
  if (socket?.connected) joinPantries();
};

export const disconnectRealtime = () => {
  pantryIds = [];
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  notify('realtime:status', { connected: false });
};

export const subscribeRealtime = (event, listener) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(listener);
  return () => listeners.get(event)?.delete(listener);
};
