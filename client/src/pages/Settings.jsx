import { useState } from 'react';
import { Bell, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePantry } from '../context/PantryContext.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedPantry } = usePantry();
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiry: false,
    activity: true,
  });

  const toggle = key => setNotifications(previous => ({ ...previous, [key]: !previous[key] }));

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Review your authenticated account and pantry preferences.</p></div></div>
    <div className="settings-grid">
      <section className="panel settings-section"><div className="settings-heading"><User/><div><h2>Account</h2><p>Details from your authenticated account</p></div></div><div className="settings-readonly"><span>Display name<strong>{user?.name || 'Welcome back'}</strong></span><span>Email<strong>{user?.email || 'Unavailable'}</strong></span></div></section>
      <section className="panel settings-section"><div className="settings-heading"><Bell/><div><h2>Notifications</h2><p>Choose what updates you receive</p></div></div>{[['lowStock','Low-stock alerts','When an item reaches its minimum'],['expiry','Expiry reminders','Review upcoming and expired items'],['activity','Member activity','Changes made to shared inventory']].map(([key,label,description])=><label className="toggle-row" key={key}><span>{label}<small>{description}</small></span><input type="checkbox" checked={notifications[key]} onChange={() => toggle(key)}/></label>)}</section>
      <section className="panel settings-section"><div className="settings-heading"><Shield/><div><h2>Selected pantry</h2><p>Pantry information is loaded from MongoDB.</p></div></div><div className="settings-readonly"><span>Pantry<strong>{selectedPantry?.name || 'No pantry selected'}</strong></span><span>Members<strong>{selectedPantry?.memberIds?.length ?? '—'}</strong></span></div><button type="button" className="btn secondary" onClick={() => navigate('/change-password')}>Change password</button></section>
    </div></div>;
}
