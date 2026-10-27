import { NavLink, useNavigate } from 'react-router-dom';

// Top navigation. Logout just returns to the login page for now.
export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <span className="brand">PantryPal</span>
      <div className="nav-links">
        <NavLink to="/pantries">Pantries</NavLink>
        <NavLink to="/members">Members</NavLink>
        <NavLink to="/activity">Activity</NavLink>
        <button className="link-button" onClick={() => navigate('/login')}>Logout</button>
      </div>
    </nav>
  );
}
