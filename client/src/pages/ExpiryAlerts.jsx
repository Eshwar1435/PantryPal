import { useEffect } from 'react';
import { CalendarClock, CircleCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePantry } from '../context/PantryContext.jsx';
import { daysUntilExpiry } from '../utils/inventoryDates.js';

export default function ExpiryAlerts() {
  const { pantryId } = useParams();
  const { user } = useAuth();
  const {
    items, updateInventoryItem, inventoryPantryId, inventoryLoading,
    inventoryError, loadInventory, selectPantry, selectedPantry, pantries,
  } = usePantry();
  const activePantryId = pantryId || inventoryPantryId;
  const activePantry = pantries.find(pantry => String(pantry.id) === String(activePantryId)) || selectedPantry;
  const isOwner = String(activePantry?.ownerId) === String(user?.id || user?._id);

  useEffect(() => {
    if (activePantryId) {
      selectPantry(activePantryId);
      loadInventory(activePantryId).catch(() => {});
    }
  }, [activePantryId]);

  const expired = items.filter(item => daysUntilExpiry(item.expiryDate) < 0);
  const soon = items.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days >= 0 && days <= 7;
  });
  const safe = items.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days > 7;
  });
  const sections = [
    { title: 'Expired', items: expired, tone: 'expired' },
    { title: 'Expiring soon', items: soon, tone: 'soon' },
    { title: 'Safe items', items: safe, tone: 'safe' },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{activePantry?.name || 'Food freshness'}</p>
          <h1>Expiry Alerts</h1>
          <p>{isOwner ? 'Select an expiry date to update it using the calendar.' : 'Review items before they expire.'}</p>
        </div>
      </div>
      {inventoryLoading ? <div className="empty-state"><p>Loading inventory...</p></div> : inventoryError ? <div className="form-error">{inventoryError}</div> : (
        <>
          <div className="expiry-summary">
            <div><span className="summary-dot red" /><strong>{expired.length}</strong><small>Expired</small></div>
            <div><span className="summary-dot amber" /><strong>{soon.length}</strong><small>Expiring soon</small></div>
            <div><span className="summary-dot green" /><strong>{safe.length}</strong><small>Safe</small></div>
          </div>
          {sections.map(section => (
            <section className="panel expiry-section" key={section.title}>
              <div className="panel-heading">
                <div><h2>{section.title}</h2><p>{section.items.length} items</p></div>
                <CalendarClock size={20} />
              </div>
              {section.items.length ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Item</th><th>Quantity</th><th>Expiry date</th><th>Status</th></tr></thead>
                    <tbody>
                      {section.items.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{isOwner ? <input className="expiry-date-input" type="date" value={item.expiryDate || ''} aria-label={`Change expiry date for ${item.name}`} onChange={event => updateInventoryItem(item.id, { expiryDate: event.target.value || null })} /> : item.expiryDate || 'No expiry date'}</td>
                          <td><span className={`status ${section.tone}`}>{section.title}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="mini-empty"><CircleCheck size={18} /> No {section.title.toLowerCase()} items</div>}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
