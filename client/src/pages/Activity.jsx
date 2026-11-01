import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';
import { getPantryActivity } from '../services/activityApi.js';

export default function ActivityHistory() {
  const { pantryId } = useParams();
  const { inventoryPantryId, selectedPantry } = usePantry();
  const activePantryId = pantryId || inventoryPantryId;
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activePantryId) return;
    setLoading(true);
    setError('');
    getPantryActivity(activePantryId)
      .then(setActivity)
      .catch(requestError => {
        setActivity([]);
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [activePantryId]);

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">{selectedPantry?.name || 'Audit log'}</p><h1>Activity History</h1><p>Review every change made to your pantry inventory.</p></div></div>{!activePantryId ? <div className="empty-state"><p>Select a pantry to view activity.</p></div> : loading ? <div className="empty-state"><p>Loading activity...</p></div> : error ? <div className="form-error">{error}</div> : <section className="panel activity-panel"><div className="activity-timeline">{activity.length ? activity.map(entry => <div className="timeline-row" key={entry.id}><div className="timeline-marker"><History size={17}/></div><div className="timeline-card"><div><div className="activity-user"><span className="mini-avatar">{entry.user[0]}</span><strong>{entry.user}</strong></div><span className="timeline-time">{new Date(entry.time).toLocaleString()}</span></div><p><strong>{entry.action.replaceAll('_', ' ')}</strong> <strong>{entry.item}</strong></p><div className="timeline-meta">{entry.changeAmount !== 0 && <span className={entry.changeAmount > 0 ? 'positive' : 'negative'}>{entry.changeAmount > 0 ? '+' : ''}{entry.changeAmount}</span>}<span>{entry.note}</span></div></div></div>) : <div className="empty-state"><p>No inventory activity yet.</p></div>}</div></section>}</div>;
}
