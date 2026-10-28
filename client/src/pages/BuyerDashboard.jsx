import { useEffect, useState } from 'react';
import { ArrowRight, PackageSearch, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';
import { getDashboardTime } from '../utils/dashboardTime.js';

export default function BuyerDashboard(){
 const navigate=useNavigate();
 const { items, cartCount, notifications, markNotificationRead, buyerProfile }=usePantry();
 const available=items.filter(item=>item.pantryId==='p1');
 const [dashboardTime, setDashboardTime] = useState(() => getDashboardTime());
 useEffect(() => { const timer = window.setInterval(() => setDashboardTime(getDashboardTime()), 30000); return () => window.clearInterval(timer); }, []);
 return <div className="page"><div className="page-heading"><div><p className="eyebrow">{dashboardTime.day} overview · {dashboardTime.date} · {dashboardTime.time}</p><h1>{dashboardTime.greeting}, {buyerProfile.name}</h1><p>Browse shared pantry items and manage your reserved cart.</p></div><Link className="btn" to="/buyer/shop"><ShoppingCart size={18}/> Browse items</Link></div><div className="buyer-stat-grid"><div className="buyer-stat"><PackageSearch/><span>Available products<strong>{available.filter(item=>item.quantity>0).length}</strong></span></div><div className="buyer-stat"><ShoppingCart/><span>Reserved items<strong>{cartCount}</strong></span></div></div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h2>Pantry inventory</h2><p>Live stock shared with the owner</p></div><Link to="/buyer/shop">Shop all</Link></div>{available.slice(0,6).map(item=> <div className="buyer-list-row" key={item.id}><span className="item-avatar">{item.name[0]}</span><div><strong>{item.name}</strong><small>{item.quantity>0?`${item.quantity} ${item.unit} available`:'Out of stock'}</small></div><span className={`priority ${item.quantity>0?'medium':'high'}`}>{item.quantity>0?'Available':'Out'}</span><Link aria-label={`View ${item.name}`} to="/buyer/shop"><ArrowRight size={17}/></Link></div>)}</section><section className="panel"><div className="panel-heading"><div><h2>New pantry items</h2><p>Updates from the owner</p></div></div>{notifications.length ? notifications.slice(0,5).map(notification=><button key={notification.id} className={`notification-item ${notification.read?'':'unread'}`} onClick={()=>{ markNotificationRead(notification.id); navigate('/buyer/shop'); }}><span className="notification-dot"/><div><strong>{notification.itemName}</strong><p>{notification.message}</p><small>{notification.time}</small></div></button>) : <div className="empty-state"><p>New owner inventory updates will appear here.</p></div>}</section></div></div>;
}
