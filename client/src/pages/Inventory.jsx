import { useMemo, useState } from 'react';
import { Edit3, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { categories } from '../data/mockData.js';
import { usePantry } from '../context/PantryContext.jsx';
import { getStatuses } from '../components/StatusBadge.jsx';

const blank = { name: '', category: 'Other', quantity: 1, unit: 'pcs', expiryDate: '', lowStockThreshold: 1, image: '' };

export default function Inventory() {
  const { items, addInventoryItem, updateInventoryItem, removeInventoryItem } = usePantry();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const filtered = useMemo(() => items.filter(item => {
    const statuses = getStatuses(item);
    const matchesStatus = status === 'All' || statuses.includes(status) || (status === 'Available' && statuses.includes('OK'));
    return item.name.toLowerCase().includes(search.toLowerCase()) && (category === 'All' || item.category === category) && matchesStatus;
  }), [items, search, category, status]);

  const openAdd = () => { setEditing(null); setForm(blank); setError(''); setModal(true); };
  const openEdit = item => { setEditing(item.id); setForm({ ...item }); setError(''); setModal(true); };
  const save = e => {
    e.preventEventDefault?.();
    e.preventDefault();
    if (!form.name.trim() || !form.expiryDate) { setError('Please enter an item name and expiry date.'); return; }
    if (editing) updateInventoryItem(editing, form);
    else addInventoryItem({ ...form, pantryId: 'p1' });
    setModal(false);
  };
  const remove = id => removeInventoryItem(id);

  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow">Shared pantry</p><h1>Inventory</h1><p>Manage and track pantry items.</p></div><button className="btn" onClick={openAdd}><Plus size={18}/> Add item</button></div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <label className="search-field"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." /></label>
        <button type="button" className={`btn secondary inventory-filter-button ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(open => !open)}><Filter size={17}/> Filters</button>
        {filtersOpen && <><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
        <select aria-label="Filter by stock status" value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Available</option><option>Low Stock</option><option>Expiring Soon</option><option>Expired</option></select></>}
      </div>
      <div className="table-wrap"><table><thead><tr><th>Item name</th><th>Category</th><th>Quantity</th><th>Expiry date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filtered.map(item => { const statuses = getStatuses(item); return <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.quantity} {item.unit}{item.reservedQuantity > 0 ? ` · ${item.reservedQuantity} reserved` : ''}</td><td>{item.expiryDate}</td><td><span className={`status ${statuses[0].toLowerCase().replaceAll(' ','-')}`}>{statuses[0]}</span></td><td><div className="row-actions"><button className="icon-button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Edit3 size={17}/></button><button className="icon-button danger" onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={17}/></button></div></td></tr>; })}
      </tbody></table></div>
      {!filtered.length && <div className="empty-state"><Search size={28}/><h3>No items found</h3><p>Try changing your search or filters.</p><button className="btn secondary" onClick={() => { setSearch(''); setCategory('All'); setStatus('All'); }}>Clear filters</button></div>}
    </section>
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}><form className="modal" onSubmit={save} noValidate><div className="modal-heading"><div><h2>{editing ? 'Edit item' : 'Add a new item'}</h2><p>Update your pantry inventory.</p></div><button type="button" className="icon-button" onClick={() => setModal(false)}>×</button></div>{error && <div className="form-error">{error}</div>}<div className="form-grid"><label>Item name<input value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label><label>Category<select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Quantity<input type="number" min="0" value={form.quantity} onChange={e => setForm({...form,quantity:Number(e.target.value)})}/></label><label>Unit<input value={form.unit} onChange={e => setForm({...form,unit:e.target.value})}/></label><label>Expiry date<input type="date" value={form.expiryDate} onChange={e => setForm({...form,expiryDate:e.target.value})}/></label><label>Low-stock threshold<input type="number" min="0" value={form.lowStockThreshold} onChange={e => setForm({...form,lowStockThreshold:Number(e.target.value)})}/></label><label>Product image URL<input type="url" value={form.image || ''} placeholder="https://…" onChange={e => setForm({...form,image:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn">{editing ? 'Save changes' : 'Add item'}</button></div></form></div>}
  </div>;
}
