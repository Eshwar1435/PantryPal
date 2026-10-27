import { useState } from 'react';
import { members as mockMembers, isOwner } from '../data/mockData.js';

// Member list plus an owner-only "add by email" form (local state only).
export default function Members() {
  const [members, setMembers] = useState(mockMembers);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    setMembers([...members, { id: 'u' + Date.now(), name: email.split('@')[0], email, role: 'Member' }]);
    setEmail('');
    setError('');
  };

  return (
    <>
      <h1>Members</h1>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}><td>{m.name}</td><td>{m.email}</td><td>{m.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Only the pantry owner sees this section (mock isOwner flag) */}
      {isOwner && (
        <>
          <h2>Add a member</h2>
          <form className="card inline-form" onSubmit={handleAdd} noValidate>
            <label>Member email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <span className="error">{error}</span>}
            </label>
            <button className="btn" type="submit">Add member</button>
          </form>
        </>
      )}
    </>
  );
}
