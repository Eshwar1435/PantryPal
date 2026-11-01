import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ChevronDown, ChevronRight, KeyRound, LayoutDashboard, LogOut, Menu, Moon, PackageMinus, Settings, ShieldCheck, Soup, Sun, TriangleAlert, User, Users, X } from 'lucide-react';
import { usePantry } from '../context/PantryContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ownerNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pantries', label: 'Pantries', icon: Soup },
  { to: '/inventory', label: 'Inventory', icon: Soup },
  { to: '/low-stock', label: 'Low Stock', icon: PackageMinus },
  { to: '/expiry-alerts', label: 'Expiry Alerts', icon: TriangleAlert },
  { to: '/activity', label: 'Activity History', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];
export default function Layout() {
  const { inventoryPantryId, selectedPantry } = usePantry();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pantrypal-theme') === 'dark');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pantryPath = inventoryPantryId ? `/pantries/${inventoryPantryId}` : '';
  const navItems = ownerNavItems.map(item => ({
    ...item,
    to: item.to === '/low-stock' ? `${pantryPath}/low-stock` : item.to === '/expiry-alerts' ? `${pantryPath}/expiry-alerts` : item.to === '/activity' ? `${pantryPath}/activity` : item.to,
  }));
  const ownerPageClass = `owner-page-${pathname.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'dashboard'}`;
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('pantrypal-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme', next);
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  if (document.documentElement.classList.contains('dark-theme') !== darkMode) {
    document.documentElement.classList.toggle('dark-theme', darkMode);
  }

  return (
    <div className={`app-shell owner-shell ${ownerPageClass} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside id="pantry-sidebar" className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Soup size={22} /></div>
          <div><strong>PantryPal</strong><span>Shared pantry management</span></div>
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon size={19} /><span>{label}</span><ChevronRight className="nav-chevron" size={16} />
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" type="button" onClick={handleLogout}><LogOut size={18}/><span>Logout</span></button>
        <div className="secure-note"><ShieldCheck size={18} /><div><strong>Everything is synced</strong><span>Last updated just now</span></div></div>
      </aside>
      {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => window.innerWidth <= 800 ? setOpen(open => !open) : setSidebarCollapsed(collapsed => !collapsed)} aria-label="Toggle sidebar menu" aria-expanded={window.innerWidth <= 800 ? open : !sidebarCollapsed} aria-controls="pantry-sidebar"><Menu size={20} /></button>
          <div className="topbar-search"><span>Shared pantry</span><strong>{selectedPantry?.name || 'Select a pantry'}</strong></div>
          <div className="topbar-actions">
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button className={!darkMode ? 'active' : ''} onClick={() => darkMode && toggleTheme()} aria-label="Light mode"><Sun size={16}/></button>
              <button className={darkMode ? 'active' : ''} onClick={() => !darkMode && toggleTheme()} aria-label="Dark mode"><Moon size={16}/></button>
            </div>
            <div className="profile-menu-wrap">
              <button className="profile-button" onClick={() => setProfileMenuOpen(open => !open)} aria-expanded={profileMenuOpen} aria-haspopup="menu"><span className="avatar">{user?.name?.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="profile-copy"><strong>{user?.name}</strong><small>Pantry member</small></span><ChevronDown className="profile-chevron" size={15}/></button>
              {profileMenuOpen && <div className="profile-menu" role="menu"><div className="profile-menu-header"><strong>{user?.name}</strong><small>{user?.email}</small></div><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}><User size={17}/> View profile</button><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}><Settings size={17}/> Account settings</button><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/change-password'); }}><KeyRound size={17}/> Change password</button><button type="button" className="profile-menu-logout" role="menuitem" onClick={() => { setProfileMenuOpen(false); handleLogout(); }}><LogOut size={17}/> Logout</button></div>}
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
