import { useEffect, useRef, useState } from 'react';
import { Camera, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';
import { resizeImage } from '../utils/resizeImage.js';

export default function BuyerSettings() {
  const navigate = useNavigate();
  const { buyerProfile, updateBuyerProfile } = usePantry();
  const [name, setName] = useState(buyerProfile.name);
  const [email, setEmail] = useState(buyerProfile.email);
  const [photo, setPhoto] = useState(buyerProfile.photo || '');
  const [saved, setSaved] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    setName(buyerProfile.name);
    setEmail(buyerProfile.email);
    setPhoto(buyerProfile.photo || '');
  }, [buyerProfile]);

  const selectPhoto = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try { setPhoto(await resizeImage(file, 240, 0.78)); } catch (error) { console.warn(error.message); }
  };

  const save = event => {
    event.preventDefault();
    updateBuyerProfile({ name: name.trim() || 'Buyer', email: email.trim(), photo });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="page">
      <div className="page-heading"><div><p className="eyebrow">Buyer preferences</p><h1>Settings</h1><p>Manage your member profile and account.</p></div></div>
      <div className="settings-grid">
        <form className="panel settings-section" onSubmit={save}>
          <div className="settings-heading"><User /><div><h2>Profile</h2><p>These details are shared with the owner</p></div></div>
          <div className="member-profile-editor buyer-profile-editor">
            <div className="member-photo large">
              {photo ? <img src={photo} alt="Buyer profile" /> : <span>{name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>}
            </div>
            <input ref={fileInput} type="file" accept="image/*" onChange={selectPhoto} hidden />
            <button className="btn secondary" type="button" onClick={() => fileInput.current?.click()}><Camera size={17} /> Change photo</button>
          </div>
          <label>Display name<input value={name} onChange={event => setName(event.target.value)} required /></label>
          <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <button className="btn" type="submit">{saved ? 'Changes saved' : 'Save changes'}</button>
        </form>
        <section className="panel settings-section">
          <div className="settings-heading"><Shield /><div><h2>Privacy & security</h2><p>Manage your buyer account password</p></div></div>
          <button type="button" className="btn secondary" onClick={() => navigate('/change-password')}>Change password</button>
        </section>
      </div>
      {saved && <div className="toast">Buyer profile updated.</div>}
    </div>
  );
}
