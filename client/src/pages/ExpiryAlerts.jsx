import { useEffect, useState } from 'react';
import { CalendarClock, CircleCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';
import { daysUntilExpiry, formatExpiryDate } from '../utils/inventoryDates.js';
import { getGlobalItems } from '../services/inventoryApi.js';
import { subscribeRealtime } from '../services/realtime.js';

export default function ExpiryAlerts() {
  const { pantryId } = useParams();
  const { selectedPantry } = usePantry();
  const [items, setItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryRevision, setInventoryRevision] = useState(0);

  useEffect(() => {
    const events = ['inventory:item-added', 'inventory:item-updated', 'inventory:item-deleted', 'inventory:quantity-updated', 'realtime:status'];
    const cleanups = events.map(event => subscribeRealtime(event, detail => {
      if (event === 'realtime:status' ? detail.connected : (!pantryId || String(detail.pantryId) === String(pantryId))) {
        if (event === 'inventory:quantity-updated' && detail.itemId && detail.quantity !== undefined) {
          setItems(previous => previous.map(item => item.id === detail.itemId
            ? { ...item, quantity: detail.quantity, updatedAt: detail.updatedAt || item.updatedAt }
            : item));
        } else {
          setInventoryRevision(previous => previous + 1);
        }
      }
    }));
    return () => cleanups.forEach(cleanup => cleanup());
  }, [pantryId]);

  useEffect(() => {
    let active = true;
    setInventoryLoading(true);
    setInventoryError('');
    getGlobalItems()
      .then(loadedItems => {
        if (active) setItems(loadedItems);
      })
      .catch(error => {
        if (active) {
          setItems([]);
          setInventoryError(error.message);
        }
      })
      .finally(() => {
        if (active) setInventoryLoading(false);
      });
    return () => { active = false; };
  }, [inventoryRevision, pantryId]);

  const visibleItems = pantryId
    ? items.filter(item => String(item.pantryId) === String(pantryId))
    : items;

  const expired = visibleItems.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days < 0;
  });
  const soon = visibleItems.filter(item => {
    const days = daysUntilExpiry(item.expiryDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const safe = visibleItems.filter(item => {
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
          <p className="eyebrow">{pantryId ? selectedPantry?.name || 'Food freshness' : 'All accessible pantries'}</p>
          <h1>Expiry Alerts</h1>
          <p>Review items before they expire.</p>
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
                    <thead><tr><th>Item</th><th>Pantry</th><th>Quantity</th><th>Expiry date</th><th>Status</th></tr></thead>
                    <tbody>
                      {section.items.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.pantryName || 'Unavailable pantry'}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{formatExpiryDate(item.expiryDate)}</td>
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
