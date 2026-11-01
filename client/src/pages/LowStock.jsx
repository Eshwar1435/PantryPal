import { useEffect, useState } from 'react';
import { PackageMinus, Plus, TriangleAlert, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';
import { getGlobalItems, changePantryItemQuantity } from '../services/inventoryApi.js';

export default function LowStock() {
  const { pantryId } = useParams();
  const { selectedPantry } = usePantry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockToAdd, setStockToAdd] = useState(1);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getGlobalItems()
      .then(loadedItems => {
        if (active) setItems(loadedItems);
      })
      .catch(requestError => {
        if (active) {
          setItems([]);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleItems = pantryId
    ? items.filter(item => String(item.pantryId) === String(pantryId))
    : items;
  const low = visibleItems.filter(item => item.quantity <= item.lowStockThreshold);

  const openRestock = item => {
    setSelectedItem(item);
    setStockToAdd(Math.max(1, item.lowStockThreshold - item.quantity + 1));
  };

  const addStock = async event => {
    event.preventDefault();
    if (!selectedItem) return;
    const amount = Math.max(0, Number(stockToAdd) || 0);
    if (!amount) return;
    setUpdating(true);
    try {
      const updatedItem = await changePantryItemQuantity(selectedItem.id, amount);
      setItems(previous => previous.map(item => item.id === selectedItem.id ? updatedItem : item));
      setSelectedItem(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  };

  return <div className="page">
    <div className="page-heading">
      <div>
        <p className="eyebrow">{pantryId ? selectedPantry?.name || 'Attention needed' : 'All accessible pantries'}</p>
        <h1>Low Stock</h1>
        <p>Items that have reached their minimum quantity.</p>
      </div>
    </div>
    {loading ? <div className="empty-state"><p>Loading inventory...</p></div> : error ? <div className="form-error">{error}</div> : <>
      <div className="alert-summary"><TriangleAlert/><div><strong>{low.length} low-stock items</strong><span>Review these items and add stock to update availability.</span></div></div>
      {low.length ? <section className="panel inventory-panel"><div className="table-wrap"><table><thead><tr><th>Item</th><th>Pantry</th><th>Category</th><th>Current</th><th>Minimum</th><th>Actions</th></tr></thead><tbody>
        {low.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.pantryName || 'Unavailable pantry'}</td><td>{item.category} · {item.unit}</td><td>{item.quantity} {item.unit}</td><td>{item.lowStockThreshold} {item.unit}</td><td><button className="btn low-stock-restock" type="button" onClick={() => openRestock(item)}><Plus size={17}/> Add stock</button></td></tr>)}
      </tbody></table></div></section> : <div className="empty-state"><PackageMinus/><h3>Everything is well stocked</h3><p>No items are currently below their threshold.</p></div>}
    </>}
    {selectedItem && <div className="modal-backdrop" onMouseDown={event => !updating && event.target === event.currentTarget && setSelectedItem(null)}><form className="modal small-modal restock-modal" onSubmit={addStock}><div className="modal-heading"><div><h2>Add stock</h2><p>{selectedItem.name}</p></div><button type="button" className="icon-button" aria-label="Close" onClick={() => !updating && setSelectedItem(null)}><X/></button></div><div className="restock-summary"><span>Available now<strong>{selectedItem.quantity} {selectedItem.unit}</strong></span><span>Minimum required<strong>{selectedItem.lowStockThreshold} {selectedItem.unit}</strong></span></div><label>Quantity to add<div className="stock-input-wrap"><input type="number" min="1" step="1" value={stockToAdd} onChange={event => setStockToAdd(event.target.value)} required disabled={updating} /><span>{selectedItem.unit}</span></div></label><div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setSelectedItem(null)} disabled={updating}>Cancel</button><button className="btn" type="submit" disabled={updating}><Plus size={17}/> {updating ? 'Updating...' : 'Update stock'}</button></div></form></div>}
  </div>;
}
