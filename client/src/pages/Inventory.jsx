import { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categories } from '../data/inventoryOptions.js';
import { usePantry } from '../context/PantryContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge, { getStatuses } from '../components/StatusBadge.jsx';
import { changePantryItemQuantity, deletePantryItem, getGlobalItems } from '../services/inventoryApi.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { subscribeRealtime } from '../services/realtime.js';

const blank = { name: '', category: 'Other', customCategory: '', hasExpiry: false, expiryDate: '', quantity: 1, unit: 'pcs', lowStockThreshold: 1 };
const predefinedCategories = new Set(categories.filter(item => item !== 'Other'));
const categoryOptions = items => [...new Set([...categories, ...items.map(item => item.category).filter(item => item && !predefinedCategories.has(item) && item !== 'Other')])];

export default function Inventory({ embedded = false, pantryId: embeddedPantryId, skipInitialLoad = false }) {
  const { pantryId: routePantryId } = useParams();
  const pantryId = embeddedPantryId || routePantryId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items, addInventoryItem, updateInventoryItem, removeInventoryItem, changeQuantity,
    inventoryLoading, inventoryError, inventoryPantryId, loadInventory, selectPantry,
    pantries,
  } = usePantry();
  const activePantryId = pantryId || inventoryPantryId;
  const activePantry = pantries.find(pantry => String(pantry.id) === String(activePantryId));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isOwner = String(activePantry?.ownerId) === String(user?.id || user?._id);
  const availableCategories = categoryOptions(items);

  useEffect(() => {
    if (!activePantryId) return;
    selectPantry(activePantryId);
    if (!skipInitialLoad) loadInventory(activePantryId).catch(() => {});
  }, [activePantryId, skipInitialLoad]);

  const filtered = useMemo(() => items.filter(item => {
    const statuses = getStatuses(item);
    const matchesStatus = status === 'All' || statuses.includes(status) || (status === 'Available' && statuses.includes('OK'));
    const query = search.toLowerCase();
    return (item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)) && (category === 'All' || item.category === category) && matchesStatus;
  }), [items, search, category, status]);

  const openAdd = () => { setEditing(null); setForm(blank); setError(''); setModal(true); };
  const openEdit = item => {
    const isCustomCategory = item.category && !predefinedCategories.has(item.category) && item.category !== 'Other';
    setEditing(item.id);
    setForm({ ...item, category: isCustomCategory ? 'Other' : item.category, customCategory: isCustomCategory ? item.category : '', hasExpiry: Boolean(item.expiryDate) });
    setError('');
    setModal(true);
  };
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const quantity = Number(form.quantity);
    const lowStockThreshold = Number(form.lowStockThreshold);
    const categoryValue = form.category === 'Other' ? form.customCategory.trim() : form.category.trim();
    if (!form.name.trim() || !form.unit.trim()) {
      setError('Item name and unit are required.');
      return;
    }
    if (!categoryValue) {
      setError(form.category === 'Other' ? 'Enter a custom category name.' : 'Item category is required.');
      return;
    }
    if (form.category === 'Other' && categoryValue.length > 60) {
      setError('Custom category name must be 60 characters or fewer.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }
    if (form.hasExpiry && (!form.expiryDate || Number.isNaN(new Date(`${form.expiryDate}T00:00:00`).getTime()))) {
      setError('Please select a valid expiry date or turn off the expiry option.');
      return;
    }
    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
      setError('Low-stock threshold must be a non-negative number.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, category: categoryValue, quantity, lowStockThreshold, expiryDate: form.hasExpiry ? form.expiryDate : null };
      delete payload.customCategory;
      delete payload.hasExpiry;
      if (editing) await updateInventoryItem(editing, payload);
      else await addInventoryItem(payload, activePantryId);
      setModal(false);
      setForm(blank);
      setEditing(null);
      setFeedback(editing ? 'Item updated successfully.' : 'Item added successfully.');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const remove = async item => {
    setPendingDelete(item);
  };
  const confirmRemove = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeInventoryItem(pendingDelete.id);
      setFeedback('Item deleted successfully.');
      setPendingDelete(null);
    } catch (requestError) { setError(requestError.message); }
    finally { setDeleting(false); }
  };
  const adjustQuantity = async (item, change) => {
    try {
      await changeQuantity(item.id, change);
      setFeedback('Quantity updated successfully.');
    } catch (requestError) { setFeedback(requestError.message); }
  };

  if (!embedded && !routePantryId) return <GlobalInventory />;
  if (!activePantryId) return <div className="page"><div className="form-error">Select a pantry to view inventory.</div><button className="btn" onClick={() => navigate('/pantries')}>View pantries</button></div>;
  if (inventoryLoading) return <div className={embedded ? 'embedded-inventory' : 'page'}><div className="empty-state"><p>Loading inventory...</p></div></div>;

  return <div className={embedded ? 'embedded-inventory' : 'page'}>
    {!embedded && <div className="page-heading"><div><p className="eyebrow">{activePantry?.name || 'Shared pantry'}</p><h1>Inventory</h1><p>Manage and track pantry items.</p></div>{isOwner && <button className="btn" onClick={openAdd}><Plus size={18}/> Add item</button>}</div>}
    {embedded && <div className="panel-heading workspace-inventory-heading"><div><h2>Inventory</h2><p>Search, filter and update this pantry's items.</p></div>{isOwner && <button className="btn" onClick={openAdd}><Plus size={18}/> Add item</button>}</div>}
    {(inventoryError || feedback) && <div className={inventoryError ? 'form-error' : 'form-success'}>{inventoryError || feedback}</div>}
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <label className="search-field"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search items..." /></label>
        <button type="button" className={`btn secondary inventory-filter-button ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(open => !open)}><Filter size={17}/> Filters</button>
        {filtersOpen && <><select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}><option value="All">All categories</option>{availableCategories.map(itemCategory => <option key={itemCategory}>{itemCategory}</option>)}</select><select aria-label="Filter by stock status" value={status} onChange={event => setStatus(event.target.value)}><option>All</option><option>Available</option><option>Low Stock</option><option>Expiring Soon</option><option>Expired</option></select></>}
      </div>
      <div className="table-wrap"><table><thead><tr><th>Item name</th><th>Category</th><th>Quantity</th><th>Expiry date</th><th>Status</th>{isOwner && <th>Actions</th>}</tr></thead><tbody>
        {filtered.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td><div className="quantity-stepper"><button className="icon-button" disabled={item.quantity <= 0} onClick={() => adjustQuantity(item, -1)} aria-label={`Decrease ${item.name}`}>−</button><span>{item.quantity} {item.unit}</span><button className="icon-button" onClick={() => adjustQuantity(item, 1)} aria-label={`Increase ${item.name}`}>+</button></div></td><td>{item.expiryDate || 'No expiry date'}</td><td><StatusBadge item={item} /></td>{isOwner && <td><div className="row-actions"><button className="icon-button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Edit3 size={17}/></button><button className="icon-button danger" onClick={() => remove(item)} aria-label={`Delete ${item.name}`}><Trash2 size={17}/></button></div></td>}</tr>)}
      </tbody></table></div>
      {!filtered.length && <div className="empty-state"><Search size={28}/><h3>No items found</h3><p>{items.length ? 'Try changing your search or filters.' : 'This pantry has no inventory items yet.'}</p>{items.length > 0 && <button className="btn secondary" onClick={() => { setSearch(''); setCategory('All'); setStatus('All'); }}>Clear filters</button>}</div>}
    </section>
    {modal && <div className="modal-backdrop" onMouseDown={event => !saving && event.target === event.currentTarget && setModal(false)}><form className="modal" onSubmit={save} noValidate><div className="modal-heading"><div><h2>{editing ? 'Edit item' : 'Add a new item'}</h2><p>Update your pantry inventory.</p></div><button type="button" className="icon-button" onClick={() => setModal(false)} disabled={saving}>×</button></div>{error && <div className="form-error">{error}</div>}<div className="form-grid"><label>Item name<input value={form.name} onChange={event => setForm({...form,name:event.target.value})} disabled={saving}/></label><label>Category<select value={form.category} onChange={event => setForm({...form,category:event.target.value,customCategory:event.target.value === 'Other' ? form.customCategory : ''})} disabled={saving}>{categories.map(itemCategory => <option key={itemCategory}>{itemCategory}</option>)}</select></label>{form.category === 'Other' && <label>Custom category name<input value={form.customCategory} maxLength="60" placeholder="e.g. Cleaning Supplies" onChange={event => setForm({...form,customCategory:event.target.value})} disabled={saving}/></label>}<label>Quantity<input type="number" min="0" value={form.quantity} onChange={event => setForm({...form,quantity:event.target.value})} disabled={saving}/></label><label>Unit<input value={form.unit} onChange={event => setForm({...form,unit:event.target.value})} disabled={saving}/></label><label className="expiry-toggle"><input type="checkbox" checked={form.hasExpiry} onChange={event => setForm({...form,hasExpiry:event.target.checked})} disabled={saving}/> This item has an expiry date</label>{form.hasExpiry && <label>Expiry date<input type="date" value={form.expiryDate} onChange={event => setForm({...form,expiryDate:event.target.value})} disabled={saving}/></label>}<label>Low-stock threshold<input type="number" min="0" value={form.lowStockThreshold} onChange={event => setForm({...form,lowStockThreshold:event.target.value})} disabled={saving}/></label></div><div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="btn" disabled={saving}>{saving ? (editing ? 'Saving...' : 'Adding...') : editing ? 'Save changes' : 'Add item'}</button></div></form></div>}
    <ConfirmDialog open={Boolean(pendingDelete)} title="Delete inventory item?" itemName={pendingDelete?.name || ''} message="This will permanently remove the item from its pantry." busy={deleting} onCancel={() => !deleting && setPendingDelete(null)} onConfirm={confirmRemove} />
  </div>;
}

function GlobalInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pantries, pantriesLoading } = usePantry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pantryId, setPantryId] = useState('all');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const quantityRequests = useRef(new Map());

  useEffect(() => {
    getGlobalItems()
      .then(setItems)
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => subscribeRealtime('inventory:quantity-updated', detail => {
    if (detail.itemId && detail.quantity !== undefined) {
      setItems(previous => previous.map(item => item.id === detail.itemId
        ? { ...item, quantity: detail.quantity, updatedAt: detail.updatedAt || item.updatedAt }
        : item));
    }
  }), []);

  const availableCategories = categoryOptions(items);
  const selectedPantry = pantries.find(pantry => String(pantry.id) === String(pantryId));
  const canAddToSelectedPantry = selectedPantry && String(selectedPantry.ownerId) === String(user?.id || user?._id);
  const filtered = useMemo(() => items.filter(item => {
    const statuses = getStatuses(item);
    const query = search.trim().toLowerCase();
    return (!query || item.name.toLowerCase().includes(query)) &&
      (pantryId === 'all' || String(item.pantryId) === String(pantryId)) &&
      (category === 'All' || item.category === category) &&
      (status === 'All' || statuses.includes(status) || (status === 'Available' && statuses.includes('OK')));
  }), [items, search, pantryId, category, status]);

  const adjustQuantity = async (item, change) => {
    const previousRequest = quantityRequests.current.get(item.id) || Promise.resolve();
    const request = previousRequest.catch(() => undefined).then(() => changePantryItemQuantity(item.id, change));
    quantityRequests.current.set(item.id, request);
    try {
      const updated = await request;
      setItems(previous => previous.map(current => current.id === item.id ? { ...current, ...updated } : current));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (quantityRequests.current.get(item.id) === request) quantityRequests.current.delete(item.id);
    }
  };

  const removeItem = async item => {
    setPendingDelete(item);
  };
  const confirmRemove = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deletePantryItem(pendingDelete.id);
      setItems(previous => previous.filter(current => current.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally { setDeleting(false); }
  };

  if (loading || pantriesLoading) return <div className="page"><div className="empty-state"><p>Loading all inventory...</p></div></div>;

  return <div className="page global-inventory">
    <div className="page-heading"><div><p className="eyebrow">Inventory overview</p><h1>All Inventory</h1><p>Manage items across your shared pantries.</p></div><div className="row-actions"><button className="btn secondary" onClick={() => navigate('/pantries')}>My Pantries</button>{canAddToSelectedPantry && <Link className="btn" to={`/pantries/${selectedPantry.id}`}>Add item</Link>}</div></div>
    {error && <div className="form-error">{error}</div>}
    <section className="panel inventory-panel">
      <div className="inventory-toolbar global-inventory-toolbar">
        <label className="search-field"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search items..." /></label>
        <select aria-label="Filter by pantry" value={pantryId} onChange={event => setPantryId(event.target.value)}><option value="all">All pantries</option>{pantries.map(pantry => <option key={pantry.id} value={pantry.id}>{pantry.name}</option>)}</select>
        <select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}><option>All categories</option>{availableCategories.map(itemCategory => <option key={itemCategory}>{itemCategory}</option>)}</select>
        <select aria-label="Filter by stock status" value={status} onChange={event => setStatus(event.target.value)}><option value="All">All statuses</option><option>Available</option><option>Low Stock</option><option>Expiring Soon</option><option>Expired</option></select>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Item name</th><th>Category</th><th>Pantry</th><th>Quantity</th><th>Unit</th><th>Expiry date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filtered.map(item => {
          const statuses = getStatuses(item);
          const isOwner = String(item.pantryOwnerId) === String(user?.id || user?._id);
          return <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td><Link className="text-link pantry-inventory-link" to={`/pantries/${item.pantryId}`}>{item.pantryName}</Link></td><td><div className="quantity-stepper"><button className="icon-button" disabled={item.quantity <= 0} onClick={() => adjustQuantity(item, -1)} aria-label={`Decrease ${item.name}`}>−</button><span>{item.quantity} {item.unit}</span><button className="icon-button" onClick={() => adjustQuantity(item, 1)} aria-label={`Increase ${item.name}`}>+</button></div></td><td>{item.expiryDate || 'No expiry date'}</td><td><StatusBadge item={item} /></td><td><div className="row-actions"><Link className="icon-button" to={`/pantries/${item.pantryId}`} aria-label={`${isOwner ? 'Edit' : 'Open pantry for'} ${item.name}`}><Edit3 size={17}/></Link>{isOwner && <button className="icon-button danger" onClick={() => removeItem(item)} aria-label={`Delete ${item.name}`}><Trash2 size={17}/></button>}</div></td></tr>;
        })}
      </tbody></table></div>
      {!filtered.length && <div className="empty-state"><Search size={28}/><h3>{items.length ? 'No items match these filters' : 'No inventory yet'}</h3><p>{items.length ? 'Try changing your search or filters.' : 'Add your first item from one of your accessible pantries.'}</p><Link className="btn secondary" to="/pantries">My Pantries</Link></div>}
    </section>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Delete inventory item?" itemName={pendingDelete?.name || ''} message="This will permanently remove the item from its pantry." busy={deleting} onCancel={() => !deleting && setPendingDelete(null)} onConfirm={confirmRemove} />
  </div>;
}
