import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pantries as mockPantries, currentUser } from '../data/mockData.js';

// Lists pantries the user belongs to and lets them "create" one (local state only).
export default function PantryList() {
  const [pantries, setPantries] = useState(mockPantries.filter((p) => p.memberIds.includes(currentUser.id)));
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Pantry name is required');
    setPantries([...pantries, { id: 'p' + Date.now(), name: name.trim(), ownerId: currentUser.id, memberIds: [currentUser.id] }]);
    setName('');
    setError('');
  };

  return (
    <>
      <h1>Your pantries</h1>
      <div className="card-grid">
        {pantries.map((p) => (
          <Link key={p.id} to={`/pantries/${p.id}`} className="card pantry-card">
            <h2>{p.name}</h2>
            <p className="muted">{p.memberIds.length} members{p.ownerId === currentUser.id ? ' · You own this' : ''}</p>
          </Link>
        ))}
      </div>

      <h2>Create a pantry</h2>
      <form className="card inline-form" onSubmit={handleCreate} noValidate>
        <label>Pantry name
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {error && <span className="error">{error}</span>}
        </label>
        <button className="btn" type="submit">Create pantry</button>
      </form>
    </>
  );
}
