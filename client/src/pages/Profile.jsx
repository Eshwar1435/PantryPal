import { Mail, MapPin, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { ownerProfile } = usePantry();
  const initials = ownerProfile.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Account</p><h1>My Profile</h1></div></div><section className="panel profile-panel"><div className="profile-banner"><div className="large-avatar">{initials}</div></div><div className="profile-details"><h2>{ownerProfile.name}</h2><p>PantryPal workspace owner</p><div><span><Mail size={18}/>{ownerProfile.email}</span><span><MapPin size={18}/>Hyderabad, India</span><span><UserRound size={18}/>Member since 2024</span></div><button className="btn" onClick={() => navigate('/settings')}>Edit profile</button></div></section></div>;
}
