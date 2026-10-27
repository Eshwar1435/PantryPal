import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Login form: validates on the frontend, then goes to /pantries (no real auth yet).
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length === 0) navigate('/pantries');
  };

  return (
    <form className="card auth-card" onSubmit={handleSubmit} noValidate>
      <h1>Log in</h1>
      <label>Email
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {errors.email && <span className="error">{errors.email}</span>}
      </label>
      <label>Password
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {errors.password && <span className="error">{errors.password}</span>}
      </label>
      <button className="btn" type="submit">Log in</button>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}
