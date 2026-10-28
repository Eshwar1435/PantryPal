import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { items as initialItems, activity as initialActivity, members } from '../data/mockData.js';

const PantryContext = createContext(null);

const saveLocal = (key, value) => {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }
  catch (error) {
    if (error?.name === 'QuotaExceededError') {
      try {
        if (key === 'pantrypal-members') localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value.map(member => ({ ...member, photo: '' })) : []));
        if (key.endsWith('-profile')) localStorage.setItem(key, JSON.stringify({ ...value, photo: '' }));
      } catch {}
    }
    console.warn(`PantryPal could not save ${key} locally.`);
  }
};

export function PantryProvider({ children }) {
  const [items, setItems] = useState(() => {
    const defaults = initialItems.map(item => ({ ...item, totalStock: item.totalStock ?? item.quantity, reservedQuantity: 0 }));
    try {
      const saved = JSON.parse(localStorage.getItem('pantrypal-inventory'));
      if (!Array.isArray(saved)) return defaults;
      const savedIds = new Set(saved.map(item => item.id));
      const mergedSaved = saved.map(item => {
        const defaultItem = defaults.find(candidate => candidate.id === item.id);
        return defaultItem ? { ...defaultItem, ...item, image: defaultItem.image || item.image } : item;
      });
      const missingDefaults = defaults.filter(item => !savedIds.has(item.id));
      return [...mergedSaved, ...missingDefaults];
    }
    catch { return defaults; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantrypal-aarav-cart')) || {}; }
    catch { return {}; }
  });
  const [activities, setActivities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantrypal-activities')) || initialActivity; }
    catch { return initialActivity; }
  });
  const [notifications, setNotifications] = useState([]);
  const [memberList, setMemberList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantrypal-members')) || members; }
    catch { return members; }
  });
  const [ownerProfile, setOwnerProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantrypal-owner-profile')) || { name: 'Tejesh', email: 'tejesh@example.com' }; }
    catch { return { name: 'Tejesh', email: 'tejesh@example.com' }; }
  });
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('pantrypal-workspace-name') || 'Hostel Room 204');
  const [buyerProfile, setBuyerProfile] = useState(() => {
    const defaultBuyerProfile = {
      name: 'Aarav',
      email: 'aarav@example.com',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&q=85'
    };
    try {
      const saved = JSON.parse(localStorage.getItem('pantrypal-buyer-profile'));
      return saved ? { ...defaultBuyerProfile, ...saved, photo: saved.photo || defaultBuyerProfile.photo } : defaultBuyerProfile;
    }
    catch { return defaultBuyerProfile; }
  });

  const currentMember = { id: 'u2', name: buyerProfile.name };

  useEffect(() => saveLocal('pantrypal-inventory', items), [items]);
  useEffect(() => saveLocal('pantrypal-aarav-cart', cart), [cart]);
  useEffect(() => saveLocal('pantrypal-activities', activities), [activities]);
  useEffect(() => saveLocal('pantrypal-members', memberList), [memberList]);
  useEffect(() => saveLocal('pantrypal-owner-profile', ownerProfile), [ownerProfile]);
  useEffect(() => saveLocal('pantrypal-buyer-profile', buyerProfile), [buyerProfile]);
  useEffect(() => saveLocal('pantrypal-workspace-name', workspaceName), [workspaceName]);
  useEffect(() => {
    const synchronize = event => {
      try {
        if (event.key === 'pantrypal-aarav-cart') setCart(JSON.parse(event.newValue || '{}'));
        if (event.key === 'pantrypal-inventory') setItems(JSON.parse(event.newValue || '[]'));
        if (event.key === 'pantrypal-activities') setActivities(JSON.parse(event.newValue || '[]'));
        if (event.key === 'pantrypal-members') setMemberList(JSON.parse(event.newValue || '[]'));
        if (event.key === 'pantrypal-owner-profile') setOwnerProfile(JSON.parse(event.newValue || '{}'));
        if (event.key === 'pantrypal-buyer-profile') setBuyerProfile(JSON.parse(event.newValue || '{}'));
        if (event.key === 'pantrypal-workspace-name') setWorkspaceName(event.newValue || 'Hostel Room 204');
      } catch {}
    };
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);
  const addActivity = (item, action, quantity, changeAmount = quantity) => {
    const entry = { id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, user: currentMember.name, memberId: currentMember.id, item, action, quantity, changeAmount, note: `${action} ${quantity} unit${quantity === 1 ? '' : 's'}`, time: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) };
    setActivities(previous => [entry, ...previous]);
  };

  const addCartItem = (itemId, amount = 1) => {
    const item = items.find(candidate => candidate.id === itemId);
    if (!item) return 0;
    const reservedQuantity = cart[itemId] || 0;
    const added = Math.min(amount, Math.max(0, item.quantity));
    if (added <= 0) return 0;
    setCart(previous => ({ ...previous, [itemId]: (previous[itemId] || 0) + added }));
    setItems(previous => previous.map(candidate => candidate.id === itemId ? { ...candidate, quantity: Math.max(0, candidate.quantity - added), reservedQuantity: Math.max(0, (candidate.reservedQuantity || 0) + added), totalStock: candidate.totalStock ?? candidate.quantity } : candidate));
    addActivity(item.name, reservedQuantity ? 'Increased cart quantity to' : 'Added to cart', reservedQuantity + added, added);
    return added;
  };

  const decreaseCartItem = (itemId) => {
    const currentQuantity = cart[itemId] || 0;
    if (!currentQuantity) return;
    const item = items.find(candidate => candidate.id === itemId);
    const nextQuantity = currentQuantity - 1;
    setCart(previous => { const next = { ...previous }; if (nextQuantity <= 0) delete next[itemId]; else next[itemId] = nextQuantity; return next; });
    setItems(previous => previous.map(candidate => candidate.id === itemId ? { ...candidate, quantity: candidate.quantity + 1, reservedQuantity: Math.max(0, (candidate.reservedQuantity || 0) - 1) } : candidate));
    addActivity(item.name, nextQuantity ? 'Decreased cart quantity to' : 'Removed from cart', nextQuantity || currentQuantity, -1);
  };

  const removeCartItem = (itemId) => {
    const quantity = cart[itemId] || 0;
    if (!quantity) return;
    const item = items.find(candidate => candidate.id === itemId);
    setCart(previous => { const next = { ...previous }; delete next[itemId]; return next; });
    setItems(previous => previous.map(candidate => candidate.id === itemId ? { ...candidate, quantity: candidate.quantity + quantity, reservedQuantity: Math.max(0, (candidate.reservedQuantity || 0) - quantity) } : candidate));
    addActivity(item.name, 'Removed from cart', quantity, -quantity);
  };

  const addInventoryItem = (item) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const newItem = { ...item, quantity, totalStock: quantity, reservedQuantity: 0, id: item.id || `i${Date.now()}`, pantryId: item.pantryId || 'p1' };
    setItems(previous => [...previous, newItem]);
    setNotifications(previous => [{ id: `notification-${Date.now()}`, itemId: newItem.id, itemName: newItem.name, message: `New pantry item added: ${newItem.name}. Check the updated inventory.`, read: false, time: 'Just now' }, ...previous]);
    return newItem;
  };

  const updateInventoryItem = (id, updates) => setItems(previous => previous.map(item => {
    if (item.id !== id) return item;
    const reserved = item.reservedQuantity || 0;
    const available = updates.quantity === undefined ? item.quantity : Math.max(0, Number(updates.quantity));
    return { ...item, ...updates, id, quantity: available, totalStock: available + reserved };
  }));
  const removeInventoryItem = (id) => setItems(previous => previous.filter(item => item.id !== id));
  const clearCart = () => {
    Object.entries(cart).forEach(([itemId, quantity]) => {
      if (!quantity) return;
      setItems(previous => previous.map(item => item.id === itemId ? { ...item, quantity: item.quantity + quantity, reservedQuantity: Math.max(0, (item.reservedQuantity || 0) - quantity) } : item));
      const product = items.find(item => item.id === itemId);
      if (product) addActivity(product.name, 'Removed from cart', quantity, -quantity);
    });
    setCart({});
  };
  const markNotificationsRead = () => setNotifications(previous => previous.map(notification => ({ ...notification, read: true })));
  const markNotificationRead = (id) => setNotifications(previous => previous.map(notification => notification.id === id ? { ...notification, read: true } : notification));
  const updateOwnerProfile = updates => setOwnerProfile(previous => ({ ...previous, ...updates }));
  const updateBuyerProfile = updates => {
    setBuyerProfile(previous => ({ ...previous, ...updates }));
    setMemberList(previous => previous.map(member => member.id === 'u2' ? { ...member, ...updates } : member));
  };
  const addMember = member => setMemberList(previous => [...previous, member]);
  const updateMember = (id, updates) => {
    setMemberList(previous => previous.map(member => member.id === id ? { ...member, ...updates } : member));
    if (id === 'u2') setBuyerProfile(previous => ({ ...previous, ...updates }));
  };
  const removeMember = id => setMemberList(previous => previous.filter(member => member.id !== id));
  const updateWorkspaceName = name => setWorkspaceName(name.trim() || 'Hostel Room 204');

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const memberCarts = { [currentMember.id]: cart };
  const value = useMemo(() => ({ items, cart, cartCount, activities, notifications, ownerProfile, buyerProfile, workspaceName, members: memberList, currentMember, memberCarts, addCartItem, decreaseCartItem, removeCartItem, clearCart, addInventoryItem, updateInventoryItem, removeInventoryItem, markNotificationsRead, markNotificationRead, updateOwnerProfile, updateBuyerProfile, updateWorkspaceName, addMember, updateMember, removeMember }), [items, cart, cartCount, activities, notifications, ownerProfile, buyerProfile, workspaceName, memberList]);
  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry() {
  const context = useContext(PantryContext);
  if (!context) throw new Error('usePantry must be used within PantryProvider');
  return context;
}
