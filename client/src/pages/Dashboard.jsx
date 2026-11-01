import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowUpRight, Clock3, Package, Plus, TriangleAlert, Users, Warehouse } from 'lucide-react';
import { usePantry } from '../context/PantryContext.jsx';
import StatusBadge, { getStatuses } from '../components/StatusBadge.jsx';
import { getDashboardTime } from '../utils/dashboardTime.js';
import { daysUntilExpiry } from '../utils/inventoryDates.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getPantryActivity } from '../services/activityApi.js';
import { getGlobalItems } from '../services/inventoryApi.js';
import { subscribeRealtime } from '../services/realtime.js';

export default function Dashboard() {
  const { pantryId } = useParams();
  const { user } = useAuth();
  const {
    items, inventoryLoading, inventoryError,
    loadInventory, selectPantry, selectedPantry, pantries, pantriesLoading,
  } = usePantry();
  const navigate = useNavigate();
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [dashboardTime, setDashboardTime] = useState(() => getDashboardTime());
  const [globalItems, setGlobalItems] = useState([]);
  const [globalActivity, setGlobalActivity] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalRevision, setGlobalRevision] = useState(0);
  const [activityRevision, setActivityRevision] = useState(0);
  const activePantryId = pantryId;
  const activePantry = pantries.find(pantry => String(pantry.id) === String(activePantryId)) || selectedPantry;
  const isOwner = String(activePantry?.ownerId) === String(user?.id || user?._id);

  useEffect(() => {
    const events = [
      'inventory:item-added',
      'inventory:item-updated',
      'inventory:item-deleted',
      'inventory:quantity-updated',
      'pantry:member-added',
      'pantry:member-removed',
      'pantry:deleted',
      'realtime:status',
    ];
    const cleanups = events.map(event => subscribeRealtime(event, detail => {
      if (event === 'realtime:status' ? detail.connected : (!activePantryId || String(detail.pantryId) === String(activePantryId))) {
        setGlobalRevision(previous => previous + 1);
      }
    }));
    const activityCleanup = subscribeRealtime('activity:created', detail => {
      if (!activePantryId || String(detail.pantryId) === String(activePantryId)) {
        setActivityRevision(previous => previous + 1);
        setGlobalRevision(previous => previous + 1);
      }
    });
    return () => [...cleanups, activityCleanup].forEach(cleanup => cleanup());
  }, [activePantryId]);

  useEffect(() => {
    if (activePantryId || pantriesLoading) return;
    setGlobalLoading(true);
    setGlobalError('');
    Promise.all([
      getGlobalItems(),
      Promise.all(pantries.map(pantry => getPantryActivity(pantry.id).catch(() => []))),
    ])
      .then(([loadedItems, activityByPantry]) => {
        setGlobalItems(loadedItems);
        setGlobalActivity(activityByPantry.flat().sort((a, b) => new Date(b.time) - new Date(a.time)));
      })
      .catch(error => setGlobalError(error.message))
      .finally(() => setGlobalLoading(false));
  }, [activePantryId, pantriesLoading, pantries, globalRevision]);

  useEffect(() => {
    if (activePantryId) {
      selectPantry(activePantryId);
      loadInventory(activePantryId).catch(() => {});
    }
  }, [activePantryId]);

  useEffect(() => {
    if (!activePantryId) {
      setActivity([]);
      return;
    }
    setActivityLoading(true);
    setActivityError('');
    getPantryActivity(activePantryId)
      .then(setActivity)
      .catch(error => {
        setActivity([]);
        setActivityError(error.message);
      })
      .finally(() => setActivityLoading(false));
  }, [activePantryId, activityRevision]);

  useEffect(() => {
    const timer = window.setInterval(() => setDashboardTime(getDashboardTime()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const low = items.filter(item => item.quantity <= item.lowStockThreshold);
  const expired = items.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days < 0;
  });
  const expiring = items.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const totalStock = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cards = [
    { label: 'Inventory items', value: items.length, detail: 'Unique items', icon: Package, tone: 'green' },
    { label: 'Total stock', value: totalStock, detail: 'All pantry units', icon: Warehouse, tone: 'blue' },
    { label: 'Low stock', value: low.length, detail: 'Needs attention', icon: TriangleAlert, tone: 'amber' },
    { label: 'Expired', value: expired.length, detail: 'Past expiry date', icon: TriangleAlert, tone: 'red' },
    { label: 'Expiring soon', value: expiring.length, detail: 'Within 7 days', icon: Clock3, tone: 'orange' },
  ];

  return <div className="page">
    <div className="page-heading welcome-heading">
      <div><p className="eyebrow">{dashboardTime.day} overview · {dashboardTime.date} · {dashboardTime.time}</p><h1>{user?.name ? `${dashboardTime.greeting}, ${user.name}` : 'Welcome back'}</h1><p>Here’s what’s happening in your shared pantry.</p></div>
      {activePantryId && isOwner && <button className="btn" onClick={() => navigate(`/pantries/${activePantryId}/inventory`)}><Plus size={18}/> Add item</button>}
    </div>

    {!activePantryId ? <GlobalDashboard pantries={pantries} items={globalItems} activity={globalActivity} user={user} loading={pantriesLoading || globalLoading} error={globalError} /> : inventoryLoading ? <div className="empty-state"><p>Loading pantry dashboard...</p></div> : inventoryError ? <div className="form-error">{inventoryError}</div> : <>
      <div className="stat-grid">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>)}
      </div>

      <div className="dashboard-grid">
        <section className="panel inventory-overview">
          <div className="panel-heading"><div><h2>Inventory overview</h2><p>{items.length ? 'Items in this pantry' : 'No inventory items yet'}</p></div><Link to={`/pantries/${activePantryId}/inventory`}>View all <ArrowUpRight size={16}/></Link></div>
          {items.length ? <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Status</th></tr></thead><tbody>{items.slice(0, 5).map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td><StatusBadge item={item} /></td></tr>)}</tbody></table></div> : <div className="empty-state"><p>This pantry has no inventory items.</p></div>}
        </section>
        <section className="panel alerts-panel">
          <div className="panel-heading"><div><h2>Stock alerts</h2><p>{low.length} items need restocking</p></div></div>
          {low.length ? low.slice(0, 3).map(item => <div className="alert-row" key={item.id}><span className="alert-icon amber"><TriangleAlert size={18}/></span><div><strong>{item.name}</strong><small>{item.quantity} {item.unit} remaining</small></div><span className="threshold">Min. {item.lowStockThreshold}</span></div>) : <div className="empty-state"><p>No low-stock items.</p></div>}
          <Link className="text-link" to={`/pantries/${activePantryId}/low-stock`}>View all low-stock items <ArrowUpRight size={16}/></Link>
        </section>
      </div>

      <div className="dashboard-grid bottom-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>Expiry notifications</h2><p>Keep track before items go bad</p></div><Link to={`/pantries/${activePantryId}/expiry-alerts`}>View all</Link></div>
          {expiring.length ? expiring.slice(0, 3).map(item => <div className="expiry-row" key={item.id}><div className="item-avatar">{item.name[0]}</div><div><strong>{item.name}</strong><small>{item.quantity} {item.unit}</small></div><span className="expiry-date">Expires {item.expiryDate}</span></div>) : <p className="empty-state">No items expiring within 7 days.</p>}
          {expired.length > 0 && <Link className="text-link" to={`/pantries/${activePantryId}/expiry-alerts`}>View {expired.length} expired item{expired.length === 1 ? '' : 's'} <ArrowUpRight size={16}/></Link>}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes to inventory</p></div><Link to={`/pantries/${activePantryId}/activity`}>History</Link></div>
          {activityLoading ? <div className="empty-state"><p>Loading activity...</p></div> : activityError ? <div className="form-error">{activityError}</div> : activity.length ? activity.slice(0, 4).map(entry => <div className="activity-row" key={entry.id}><span className={`activity-dot ${entry.changeAmount > 0 ? 'added' : ''}`}><Activity size={15}/></span><div><strong>{entry.user} {entry.action?.replaceAll('_', ' ').toLowerCase()} {entry.item}</strong><small>{entry.note} · {new Date(entry.time).toLocaleString()}</small></div></div>) : <div className="empty-state"><p>No inventory activity yet.</p></div>}
        </section>
      </div>
    </>}
  </div>;
}

function GlobalDashboard({ pantries, items, activity, user, loading, error }) {
  const navigate = useNavigate();
  const summary = pantries.map(pantry => {
    const pantryItems = items.filter(item => String(item.pantryId) === String(pantry.id));
    return {
      pantry,
      items: pantryItems,
      low: pantryItems.filter(item => getStatuses(item).includes('Low Stock')),
      expiring: pantryItems.filter(item => getStatuses(item).includes('Expiring Soon')),
    };
  });
  const lowCount = summary.reduce((total, entry) => total + entry.low.length, 0);
  const expiringCount = summary.reduce((total, entry) => total + entry.expiring.length, 0);
  const memberCount = new Set(pantries.flatMap(pantry => pantry.memberIds || []).map(String)).size;
  const cards = [
    { label: 'Accessible pantries', value: pantries.length, icon: Warehouse, tone: 'green' },
    { label: 'Inventory items', value: items.length, icon: Package, tone: 'blue' },
    { label: 'Low stock', value: lowCount, icon: TriangleAlert, tone: 'amber' },
    { label: 'Expiring soon', value: expiringCount, icon: Clock3, tone: 'orange' },
    { label: 'Unique members', value: memberCount, icon: Users, tone: 'green' },
  ];

  if (loading) return <div className="empty-state"><p>Loading your pantry overview...</p></div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!pantries.length) return <div className="empty-state"><p>You do not belong to any pantries yet.</p><Link className="btn" to="/pantries">View pantries</Link></div>;

  return <div className="global-dashboard">
    <div className="stat-grid">{cards.map(({ label, value, icon: Icon, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div><span>{label}</span><strong>{value}</strong><small>Across accessible pantries</small></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Pantry overview</h2><p>All spaces you can access</p></div><Link to="/pantries">Manage pantries <ArrowUpRight size={16}/></Link></div><div className="pantry-overview-grid">{summary.map(({ pantry, items: pantryItems, low, expiring }) => { const openPantry = () => navigate(`/pantries/${pantry.id}`); const handleKeyDown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPantry(); } }; return <article className="pantry-overview-card" key={pantry.id} role="link" tabIndex="0" onClick={openPantry} onKeyDown={handleKeyDown} aria-label={`Open ${pantry.name} pantry workspace`}><div><h3>{pantry.name}</h3><span className="role">{String(pantry.ownerId) === String(user?.id || user?._id) ? 'Owner' : 'Member'}</span></div><p>{pantryItems.length} items · {low.length} low stock · {expiring.length} expiring</p></article>; })}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes across your pantries</p></div><Link to="/activity">History</Link></div>{activity.length ? activity.slice(0, 5).map(entry => <div className="activity-row" key={entry.id}><span className="activity-dot"><Activity size={15}/></span><div><strong>{entry.user} {entry.action?.replaceAll('_', ' ').toLowerCase()} {entry.item}</strong><small>Pantry: {entry.pantryName} · {entry.note} · {new Date(entry.time).toLocaleString()}</small></div></div>) : <div className="empty-state"><p>No inventory activity yet.</p></div>}</section>
    </div>
  </div>;
}
