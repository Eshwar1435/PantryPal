import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, Package, TriangleAlert, Users } from 'lucide-react';
import Inventory from './Inventory.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePantry } from '../context/PantryContext.jsx';
import { daysUntilExpiry } from '../utils/inventoryDates.js';

export default function PantryWorkspace() {
  const { pantryId } = useParams();
  const { user } = useAuth();
  const {
    items, inventoryLoading, inventoryError, loadInventory, selectPantry,
    pantries, pantriesLoading,
  } = usePantry();
  const pantry = pantries.find(item => String(item.id) === String(pantryId));
  const isOwner = String(pantry?.ownerId) === String(user?.id || user?._id);

  useEffect(() => {
    if (!pantryId) return;
    selectPantry(pantryId);
    loadInventory(pantryId).catch(() => undefined);
  }, [pantryId]);

  const lowStock = useMemo(() => items.filter(item => item.quantity <= item.lowStockThreshold).length, [items]);
  const expiringSoon = useMemo(() => items.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days >= 0 && days <= 7;
  }).length, [items]);

  if (pantriesLoading || inventoryLoading && !pantry) {
    return <div className="page"><div className="empty-state"><p>Loading pantry workspace...</p></div></div>;
  }
  if (!pantry) {
    return <div className="page"><div className="form-error">This pantry is unavailable or you no longer have access.</div><Link className="btn" to="/pantries">Back to pantries</Link></div>;
  }

  return <div className="page pantry-workspace">
    <div className="workspace-heading">
      <div>
        <p className="eyebrow">Pantry workspace</p>
        <h1>{pantry?.name || 'Loading pantry...'}</h1>
        <p>{isOwner ? 'Owner workspace' : 'Shared member workspace'}</p>
      </div>
      {pantry && <Link className="btn secondary" to={`/pantries/${pantry.id}/members`}><Users size={17}/> Manage members</Link>}
    </div>
    <div className="workspace-stat-grid">
      <div className="workspace-stat"><Package size={19}/><span>Inventory items<strong>{items.length}</strong></span></div>
      <div className="workspace-stat"><Users size={19}/><span>Members<strong>{pantry?.memberIds?.length || 0}</strong></span></div>
      <div className="workspace-stat"><TriangleAlert size={19}/><span>Low stock<strong>{lowStock}</strong></span></div>
      <div className="workspace-stat"><Clock3 size={19}/><span>Expiring soon<strong>{expiringSoon}</strong></span></div>
    </div>
    {inventoryError && <div className="form-error">{inventoryError}</div>}
    <Inventory embedded pantryId={pantryId} skipInitialLoad />
  </div>;
}
