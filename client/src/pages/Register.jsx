import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Register form: validates on the frontend, then goes to /pantries (no real auth yet).
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length === 0) navigate('/pantries');
  };

  return (
    <form className="card auth-card" onSubmit={handleSubmit} noValidate>
      <h1>Create account</h1>
      <label>Name
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {errors.name && <span className="error">{errors.name}</span>}
      </label>
      <label>Email
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {errors.email && <span className="error">{errors.email}</span>}
      </label>
      <label>Password
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {errors.password && <span className="error">{errors.password}</span>}
      </label>
      <button className="btn" type="submit">Create account</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
