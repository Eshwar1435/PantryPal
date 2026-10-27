import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PantryList from './pages/PantryList.jsx';
import PantryDashboard from './pages/PantryDashboard.jsx';
import Members from './pages/Members.jsx';
import Activity from './pages/Activity.jsx';

// App routes. The navbar is hidden on the login and register pages.
export default function App() {
  const { pathname } = useLocation();
  const hideNav = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!hideNav && <Navbar />}
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pantries" element={<PantryList />} />
          <Route path="/pantries/:id" element={<PantryDashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
