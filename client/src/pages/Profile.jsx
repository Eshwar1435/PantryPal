import { Mail, MapPin, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = user?.name || 'Welcome back';
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Account</p><h1>My Profile</h1></div></div><section className="panel profile-panel"><div className="profile-banner"><div className="large-avatar">{initials}</div></div><div className="profile-details"><h2>{name}</h2><p>PantryPal account</p><div><span><Mail size={18}/>{user?.email || 'No email available'}</span><span><UserRound size={18}/>Authenticated member</span></div><button className="btn" onClick={() => navigate('/settings')}>Account settings</button></div></section></div>;
}
