import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, ShoppingBag } from 'lucide-react';

export default function BuyerLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 6) { setError('Enter a valid email and password with at least 6 characters.'); return; }
    navigate('/buyer/dashboard');
  };
  return <div className="auth-page buyer-auth"><main className="auth-form-panel"><form className="auth-form" onSubmit={submit} noValidate><div className="portal-icon"><ShoppingBag /></div><p className="eyebrow">Buyer portal</p><h1>Buyer Login</h1><p className="auth-subtitle">Browse available items and place orders directly.</p><label>Email address<div className="input-icon"><Mail size={18}/><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="buyer@example.com" /></div></label><label>Password<div className="input-icon"><LockKeyhole size={18}/><input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="At least 6 characters" /></div></label>{error && <div className="form-error">{error}</div>}<button className="btn auth-submit">Sign in as buyer</button><p className="auth-switch">New buyer? <Link to="/buyer/register">Create a buyer account</Link></p><p className="portal-switch"><Link to="/owner/login">Owner login instead</Link></p></form></main><div className="auth-brand-panel buyer-brand"><div className="auth-brand"><span><ShoppingBag /></span><strong>PantryPal Buyer</strong></div><div><h2>Shop smarter for the pantry.</h2><p>Add available pantry items to your cart and complete orders directly.</p></div></div></div>;
}
