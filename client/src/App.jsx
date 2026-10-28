import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BuyerLogin from './pages/BuyerLogin.jsx';
import BuyerRegister from './pages/BuyerRegister.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import LowStock from './pages/LowStock.jsx';
import ExpiryAlerts from './pages/ExpiryAlerts.jsx';
import Members from './pages/Members.jsx';
import Activity from './pages/Activity.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';
import BuyerShopping from './pages/BuyerShopping.jsx';
import BuyerRequests from './pages/BuyerRequests.jsx';
import PortalLogin from './pages/PortalLogin.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import BuyerSettings from './pages/BuyerSettings.jsx';
import BuyerProfile from './pages/BuyerProfile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PortalLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/owner/login" element={<Login />} />
      <Route path="/owner/register" element={<Register />} />
      <Route path="/buyer/login" element={<BuyerLogin />} />
      <Route path="/buyer/register" element={<BuyerRegister />} />
      <Route path="/portal" element={<Navigate to="/login" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/low-stock" element={<LowStock />} />
        <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
        <Route path="/members" element={<Members />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/shop" element={<BuyerShopping />} />
        <Route path="/buyer/requests" element={<BuyerRequests />} />
        <Route path="/buyer/orders" element={<BuyerRequests />} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
        <Route path="/buyer/settings" element={<BuyerSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
