import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { listPantries } from '../services/pantryApi.js';
import { addPantryItem, changePantryItemQuantity, deletePantryItem, getPantryItems, updatePantryItem } from '../services/inventoryApi.js';
import { configureRealtimePantries, subscribeRealtime } from '../services/realtime.js';

const PantryContext = createContext(null);

export function PantryProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [inventoryPantryId, setInventoryPantryId] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [pantries, setPantries] = useState([]);
  const [pantriesLoading, setPantriesLoading] = useState(true);
  const inventoryRequestRef = useRef(0);
  const quantityRequestsRef = useRef(new Map());
  const refreshPantries = async () => {
    if (!user) {
      setPantries([]);
      setPantriesLoading(false);
      return [];
    }
    try {
      const loadedPantries = await listPantries();
      setPantries(loadedPantries);
      configureRealtimePantries(loadedPantries);
      setInventoryPantryId(previous => loadedPantries.some(pantry => String(pantry.id) === String(previous)) ? previous : '');
      return loadedPantries;
    } finally {
      setPantriesLoading(false);
    }
  };
  useEffect(() => {
    inventoryRequestRef.current += 1;
    setItems([]);
    setInventoryError('');
    setInventoryPantryId('');
    refreshPantries().catch(() => setPantries([]));
  }, [user]);
  useEffect(() => {
    const inventoryEvents = [
      'inventory:item-added',
      'inventory:item-updated',
      'inventory:item-deleted',
      'inventory:quantity-updated',
    ];
    const cleanups = inventoryEvents.map(event => subscribeRealtime(event, detail => {
      if (String(detail.pantryId) === String(inventoryPantryId)) {
        loadInventory(inventoryPantryId).catch(() => undefined);
      }
    }));
    const pantryCleanup = ['pantry:member-added', 'pantry:member-removed', 'pantry:ownership-transferred', 'pantry:deleted']
      .map(event => subscribeRealtime(event, detail => {
        refreshPantries().catch(() => undefined);
        if (String(detail.pantryId) === String(inventoryPantryId) &&
          (event === 'pantry:deleted' ||
            (event === 'pantry:member-removed' &&
              String(detail.memberId) === String(user?.id || user?._id)))) {
          setItems([]);
          setInventoryPantryId('');
        }
      }));
    const accessCleanup = subscribeRealtime('pantry:access-revoked', detail => {
      if (String(detail.pantryId) === String(inventoryPantryId)) {
        setItems([]);
        setInventoryPantryId('');
        refreshPantries().catch(() => undefined);
      }
    });
    const statusCleanup = subscribeRealtime('realtime:status', detail => {
      if (detail.connected) {
        refreshPantries().catch(() => undefined);
        if (inventoryPantryId) loadInventory(inventoryPantryId).catch(() => undefined);
      }
    });
    return () => [...cleanups, ...pantryCleanup, accessCleanup, statusCleanup].forEach(cleanup => cleanup());
  }, [inventoryPantryId, user]);
  const selectPantry = pantryId => {
    setInventoryPantryId(pantryId);
  };
  const loadInventory = async pantryId => {
    if (!pantryId) return;
    const requestId = inventoryRequestRef.current + 1;
    inventoryRequestRef.current = requestId;
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const loadedItems = await getPantryItems(pantryId);
      if (requestId !== inventoryRequestRef.current) return loadedItems;
      setItems(loadedItems);
      setInventoryPantryId(pantryId);
    } catch (error) {
      if (requestId !== inventoryRequestRef.current) return [];
      setItems([]);
      setInventoryError(error.message);
      throw error;
    } finally {
      if (requestId === inventoryRequestRef.current) setInventoryLoading(false);
    }
  };
  const addInventoryItem = async (item, pantryId = inventoryPantryId) => {
    if (!pantryId) throw new Error('Select a pantry before adding an item.');
    const newItem = await addPantryItem(pantryId, item);
    setItems(previous => [...previous, newItem]);
    return newItem;
  };
  const updateInventoryItem = async (id, updates) => {
    const updatedItem = await updatePantryItem(id, updates);
    setItems(previous => previous.map(item => item.id === id ? updatedItem : item));
    return updatedItem;
  };
  const removeInventoryItem = async id => {
    await deletePantryItem(id);
    setItems(previous => previous.filter(item => item.id !== id));
  };
  const changeQuantity = async (id, change) => {
    const previousRequest = quantityRequestsRef.current.get(id) || Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(() => changePantryItemQuantity(id, change))
      .then(updatedItem => {
        setItems(previous => previous.map(item => item.id === id ? updatedItem : item));
        return updatedItem;
      });
    quantityRequestsRef.current.set(id, request);
    try {
      return await request;
    } finally {
      if (quantityRequestsRef.current.get(id) === request) quantityRequestsRef.current.delete(id);
    }
  };
  const selectedPantry = pantries.find(pantry => String(pantry.id) === String(inventoryPantryId));
  const value = useMemo(() => ({ items, addInventoryItem, updateInventoryItem, removeInventoryItem, changeQuantity, inventoryLoading, inventoryError, inventoryPantryId, selectedPantry, pantries, pantriesLoading, selectPantry, loadInventory, refreshPantries }), [items, inventoryLoading, inventoryError, inventoryPantryId, selectedPantry, pantries, pantriesLoading]);
  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry() {
  const context = useContext(PantryContext);
  if (!context) throw new Error('usePantry must be used within PantryProvider');
  return context;
}
