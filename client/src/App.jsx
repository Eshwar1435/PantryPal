import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import LowStock from './pages/LowStock.jsx';
import ExpiryAlerts from './pages/ExpiryAlerts.jsx';
import Members from './pages/Members.jsx';
import Activity from './pages/Activity.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import PantryList from './pages/PantryList.jsx';
import PantryWorkspace from './pages/PantryWorkspace.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/owner/login" element={<Navigate to="/login" replace />} />
      <Route path="/owner/register" element={<Navigate to="/register" replace />} />
      <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pantries" element={<PantryList />} />
        <Route path="/pantries/:pantryId" element={<PantryWorkspace />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/pantries/:pantryId/inventory" element={<Inventory />} />
        <Route path="/low-stock" element={<LowStock />} />
        <Route path="/pantries/:pantryId/low-stock" element={<LowStock />} />
        <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
        <Route path="/pantries/:pantryId/expiry-alerts" element={<ExpiryAlerts />} />
        <Route path="/pantries/:id/members" element={<Members />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/pantries/:pantryId/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
