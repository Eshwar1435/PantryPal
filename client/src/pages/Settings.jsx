import { useEffect, useState } from 'react';
import { Bell, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePantry } from '../context/PantryContext.jsx';
import { getPantryMembers } from '../services/pantryApi.js';
import { getPreferences, updatePreferences } from '../services/authApi.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const { selectedPantry, pantries, pantriesLoading } = usePantry();
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiry: true,
    memberActivity: true,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  const [ownedPantries, setOwnedPantries] = useState([]);
  const [ownedPantriesLoading, setOwnedPantriesLoading] = useState(true);
  const [pantryLoadError, setPantryLoadError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [ownershipTransfers, setOwnershipTransfers] = useState({});
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setPreferencesLoading(true);
    setPreferencesError('');
    getPreferences()
      .then(({ preferences }) => {
        if (active) setNotifications(previous => ({ ...previous, ...preferences }));
      })
      .catch(error => {
        if (active) setPreferencesError(error.message || 'Unable to load notification preferences.');
      })
      .finally(() => {
        if (active) setPreferencesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const toggle = async key => {
    const nextValue = !notifications[key];
    setNotifications(previous => ({ ...previous, [key]: nextValue }));
    setPreferencesSaving(key);
    setPreferencesError('');
    try {
      const { preferences } = await updatePreferences({ [key]: nextValue });
      setNotifications(previous => ({ ...previous, ...preferences }));
    } catch (error) {
      setNotifications(previous => ({ ...previous, [key]: !nextValue }));
      setPreferencesError(error.message || 'Unable to save notification preferences.');
    } finally {
      setPreferencesSaving('');
    }
  };

  useEffect(() => {
    let active = true;
    const userId = String(user?.id || user?._id || '');
    const owned = pantries.filter(pantry => String(pantry.ownerId) === userId);

    setOwnedPantriesLoading(true);
    if (!owned.length) {
      setOwnedPantries([]);
      setOwnedPantriesLoading(false);
      return () => { active = false; };
    }

    setPantryLoadError('');
    Promise.all(owned.map(async pantry => ({
      ...pantry,
      members: await getPantryMembers(pantry.id),
    })))
      .then(details => { if (active) { setOwnedPantries(details); setOwnedPantriesLoading(false); } })
      .catch(error => {
        if (active) {
          setPantryLoadError(error.message || 'Unable to load owned pantry members.');
          setOwnedPantriesLoading(false);
        }
      });

    return () => { active = false; };
  }, [pantries, user]);

  const sharedOwnedPantries = ownedPantries.filter(pantry => (
    pantry.members.filter(member => String(member.id) !== String(user?.id || user?._id)).length > 0
  ));

  const openDeleteDialog = () => {
    setDeleteError('');
    setPassword('');
    setConfirmation('');
    setDeleteOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleting) return;
    if (!password) {
      setDeleteError('Enter your current password.');
      return;
    }
    if (confirmation !== 'DELETE') {
      setDeleteError('Type DELETE exactly to confirm account deletion.');
      return;
    }
    const missingTransfer = sharedOwnedPantries.find(pantry => !ownershipTransfers[pantry.id]);
    if (missingTransfer) {
      setDeleteError(`Choose a new owner for "${missingTransfer.name}".`);
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount({
        password,
        confirmation,
        ownershipTransfers: sharedOwnedPantries.map(pantry => ({
          pantryId: pantry.id,
          newOwnerId: ownershipTransfers[pantry.id],
        })),
      });
      navigate('/login', { replace: true });
    } catch (error) {
      setDeleteError(error.message || 'Unable to delete your account.');
      setDeleting(false);
    }
  };

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Review your authenticated account and pantry preferences.</p></div></div>
    <div className="settings-grid">
      <section className="panel settings-section"><div className="settings-heading"><User/><div><h2>Account</h2><p>Details from your authenticated account</p></div></div><div className="settings-readonly"><span>Display name<strong>{user?.name || 'Welcome back'}</strong></span><span>Email<strong>{user?.email || 'Unavailable'}</strong></span></div><div className="account-danger"><div><strong>Delete account</strong><small>Permanently delete your account and private pantries.</small></div><button type="button" className="btn danger-button" onClick={openDeleteDialog} disabled={pantriesLoading || ownedPantriesLoading || Boolean(pantryLoadError)}>Delete account</button></div>{pantryLoadError && <div className="form-error">{pantryLoadError}</div>}</section>
      <section className="panel settings-section"><div className="settings-heading"><Bell/><div><h2>Notifications</h2><p>Choose what updates you receive</p></div></div>{preferencesLoading ? <div className="empty-state"><p>Loading notification preferences...</p></div> : [['lowStock','Low-stock alerts','When an item reaches its minimum'],['expiry','Expiry reminders','Review upcoming and expired items'],['memberActivity','Member activity','Changes made to shared inventory']].map(([key,label,description])=><label className="toggle-row" key={key}><span>{label}<small>{description}</small></span><input type="checkbox" checked={notifications[key]} onChange={() => toggle(key)} disabled={Boolean(preferencesSaving)}/></label>)}{preferencesSaving && <small>Saving preference...</small>}{preferencesError && <div className="form-error">{preferencesError}</div>}</section>
      <section className="panel settings-section"><div className="settings-heading"><Shield/><div><h2>Selected pantry</h2><p>Pantry information is loaded from MongoDB.</p></div></div><div className="settings-readonly"><span>Pantry<strong>{selectedPantry?.name || 'No pantry selected'}</strong></span><span>Members<strong>{selectedPantry?.memberIds?.length ?? '—'}</strong></span></div><button type="button" className="btn secondary" onClick={() => navigate('/change-password')}>Change password</button></section>
    </div><ConfirmDialog open={deleteOpen} title="Delete your account?" itemName="Your PantryPal account" message="Review the final deletion summary, then confirm with your password." confirmLabel="Delete account" busy={deleting} onCancel={() => !deleting && setDeleteOpen(false)} onConfirm={confirmDeleteAccount}><div className="delete-account-content"><p><strong>Deletion summary</strong></p><ul><li>{ownedPantries.filter(pantry => !sharedOwnedPantries.includes(pantry)).length} private pantry(s) and their inventory and activity will be deleted.</li><li>{sharedOwnedPantries.length} shared pantry(s) will remain and require a new owner.</li><li>Your membership and historical actor references will be removed or anonymized.</li></ul>{sharedOwnedPantries.map(pantry => { const members = pantry.members.filter(member => String(member.id) !== String(user?.id || user?._id)); return <label className="delete-transfer-row" key={pantry.id}><span>{pantry.name}<small>Choose an existing member as the new owner.</small></span><select value={ownershipTransfers[pantry.id] || ''} onChange={event => setOwnershipTransfers(previous => ({ ...previous, [pantry.id]: event.target.value }))} disabled={deleting}><option value="">Select new owner</option>{members.map(member => <option value={member.id} key={member.id}>{member.name} ({member.email})</option>)}</select></label>; })}<label className="delete-field"><span>Current password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={deleting} /></label><label className="delete-field"><span>Type DELETE to confirm</span><input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={deleting} /></label>{deleteError && <div className="form-error">{deleteError}</div>}</div></ConfirmDialog></div>;
}
