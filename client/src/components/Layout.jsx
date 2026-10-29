import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, ChevronDown, ChevronRight, KeyRound, LayoutDashboard, LogOut, Menu, Moon, PackageMinus, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Soup, Sun, TriangleAlert, User, Users, X } from 'lucide-react';
import { usePantry } from '../context/PantryContext.jsx';

const ownerNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Soup },
  { to: '/low-stock', label: 'Low Stock', icon: PackageMinus },
  { to: '/expiry-alerts', label: 'Expiry Alerts', icon: TriangleAlert },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/activity', label: 'Activity History', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];
const buyerNavItems = [
  { to: '/buyer/dashboard', label: 'Buyer Dashboard', icon: LayoutDashboard },
  { to: '/buyer/shop', label: 'Shop Pantry Items', icon: ShoppingCart },
  { to: '/buyer/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/buyer/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { notifications, markNotificationsRead, markNotificationRead, ownerProfile, buyerProfile, workspaceName } = usePantry();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pantrypal-theme') === 'dark');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isBuyer = pathname.startsWith('/buyer/');
  const navItems = isBuyer ? buyerNavItems : ownerNavItems;
  const ownerPageClass = !isBuyer ? `owner-page-${pathname.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'dashboard'}` : '';
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('pantrypal-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme', next);
  };
  if (document.documentElement.classList.contains('dark-theme') !== darkMode) {
    document.documentElement.classList.toggle('dark-theme', darkMode);
  }

  return (
    <div className={`app-shell ${isBuyer ? 'buyer-shell' : 'owner-shell'} ${ownerPageClass} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Soup size={22} /></div>
          <div><strong>PantryPal</strong><span>{isBuyer ? 'Buyer purchasing portal' : 'Owner management portal'}</span></div>
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon size={19} /><span>{label}</span><ChevronRight className="nav-chevron" size={16} />
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" type="button" onClick={() => navigate('/login')}><LogOut size={18}/><span>Logout</span></button>
        <div className="secure-note"><ShieldCheck size={18} /><div><strong>Everything is synced</strong><span>Last updated just now</span></div></div>
      </aside>
      {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => window.innerWidth <= 800 ? setOpen(open => !open) : setSidebarCollapsed(collapsed => !collapsed)} aria-label="Toggle sidebar menu"><Menu /></button>
          <div className="topbar-search"><span>Shared workspace</span><strong>{workspaceName}</strong></div>
          <div className="topbar-actions">
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button className={!darkMode ? 'active' : ''} onClick={() => darkMode && toggleTheme()} aria-label="Light mode"><Sun size={16}/></button>
              <button className={darkMode ? 'active' : ''} onClick={() => !darkMode && toggleTheme()} aria-label="Dark mode"><Moon size={16}/></button>
            </div>
            <div className="notification-wrap">
              <button className="icon-button notification" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={20} />{isBuyer && notifications.some(notification => !notification.read) && <span>{notifications.filter(notification => !notification.read).length}</span>}</button>
              {notificationsOpen && <div className="notification-popover"><div className="notification-heading"><strong>Notifications</strong>{isBuyer && notifications.length > 0 ? <button onClick={markNotificationsRead}>Mark all read</button> : <button onClick={() => setNotificationsOpen(false)}>Close</button>}</div>{isBuyer && notifications.length ? notifications.map(notification => <button type="button" key={notification.id} className={`notification-item ${notification.read ? '' : 'unread'}`} onClick={() => { markNotificationRead(notification.id); navigate('/buyer/shop'); setNotificationsOpen(false); }}><span className="notification-dot"/><div><strong>New pantry item</strong><p>{notification.message}</p><small>{notification.time}</small></div></button>) : <><div className="notification-item unread"><span className="notification-dot"/><div><strong>{isBuyer ? 'Inventory ready' : 'Low stock alert'}</strong><p>{isBuyer ? 'Browse products available in the shared pantry.' : 'Eggs have reached the minimum quantity.'}</p><small>12 minutes ago</small></div></div>{!isBuyer && <div className="notification-item"><span className="notification-dot amber-dot"/><div><strong>Items expiring soon</strong><p>Milk expires in 3 days.</p><small>1 hour ago</small></div></div>}</>}</div>}
            </div>
            <div className="profile-menu-wrap">
              <button className="profile-button" onClick={() => setProfileMenuOpen(open => !open)} aria-expanded={profileMenuOpen} aria-haspopup="menu"><span className="avatar">{isBuyer && buyerProfile.photo ? <img src={buyerProfile.photo} alt="" /> : isBuyer ? buyerProfile.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() : ownerProfile.name.slice(0, 2).toUpperCase()}</span><span className="profile-copy"><strong>{isBuyer ? buyerProfile.name : ownerProfile.name}</strong><small>{isBuyer ? 'Buyer' : 'Owner'}</small></span><ChevronDown className="profile-chevron" size={15}/></button>
              {profileMenuOpen && <div className="profile-menu" role="menu"><div className="profile-menu-header"><strong>{isBuyer ? buyerProfile.name : ownerProfile.name}</strong><small>{isBuyer ? buyerProfile.email : ownerProfile.email}</small></div><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate(isBuyer ? '/buyer/profile' : '/profile'); }}><User size={17}/> View profile</button><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate(isBuyer ? '/buyer/settings' : '/settings'); }}><Settings size={17}/> Account settings</button><button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/change-password'); }}><KeyRound size={17}/> Change password</button><button type="button" className="profile-menu-logout" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/login'); }}><LogOut size={17}/> Logout</button></div>}
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
