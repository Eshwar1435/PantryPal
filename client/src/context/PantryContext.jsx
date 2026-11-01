import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { listPantries } from '../services/pantryApi.js';
import { addPantryItem, changePantryItemQuantity, deletePantryItem, getPantryItems, updatePantryItem } from '../services/inventoryApi.js';

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
