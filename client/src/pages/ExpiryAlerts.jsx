import { CalendarClock, CircleCheck } from 'lucide-react';
import { usePantry } from '../context/PantryContext.jsx';

export default function ExpiryAlerts() {
  const { items, updateInventoryItem } = usePantry();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = item => Math.ceil((new Date(`${item.expiryDate}T00:00:00`) - today) / 86400000);
  const expired = items.filter(item => daysUntil(item) < 0);
  const soon = items.filter(item => { const days = daysUntil(item); return days >= 0 && days <= 7; });
  const safe = items.filter(item => daysUntil(item) > 7);
  const sections = [{ title: 'Expired', items: expired, tone: 'expired' }, { title: 'Expiring soon', items: soon, tone: 'soon' }, { title: 'Safe items', items: safe, tone: 'safe' }];

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Food freshness</p><h1>Expiry Alerts</h1><p>Select an expiry date to update it using the calendar.</p></div></div>
    <div className="expiry-summary"><div><span className="summary-dot red"/><strong>{expired.length}</strong><small>Expired</small></div><div><span className="summary-dot amber"/><strong>{soon.length}</strong><small>Expiring soon</small></div><div><span className="summary-dot green"/><strong>{safe.length}</strong><small>Safe</small></div></div>
    {sections.map(section => <section className="panel expiry-section" key={section.title}><div className="panel-heading"><div><h2>{section.title}</h2><p>{section.items.length} items</p></div><CalendarClock size={20}/></div>{section.items.length ? <div className="table-wrap"><table><thead><tr><th>Item</th><th>Quantity</th><th>Expiry date</th><th>Status</th></tr></thead><tbody>{section.items.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.quantity} {item.unit}</td><td><input className="expiry-date-input" type="date" value={item.expiryDate || ''} aria-label={`Change expiry date for ${item.name}`} onChange={event => updateInventoryItem(item.id, { ...item, expiryDate: event.target.value })}/></td><td><span className={`status ${section.tone}`}>{section.title}</span></td></tr>)}</tbody></table></div> : <div className="mini-empty"><CircleCheck size={18}/> No {section.title.toLowerCase()} items</div>}</section>)    }</div>;
    }