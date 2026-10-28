import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';

const formatUnit = (quantity, unit) => {
 if (unit === 'litres') return quantity === 1 ? 'litre' : 'litres';
 if (unit === 'pcs') return quantity === 1 ? 'piece' : 'pieces';
 return unit;
};

export default function BuyerRequests(){
 const { items, cart, cartCount, addCartItem, decreaseCartItem, removeCartItem }=usePantry();
 const entries=Object.entries(cart).filter(([,qty])=>qty>0);
 return <div className="page"><div className="page-heading"><div><p className="eyebrow">Buyer portal</p><h1>Your cart</h1><p>Reserved items remain unavailable to others until removed.</p></div><Link className="btn secondary" to="/buyer/shop">Continue shopping</Link></div><div className="checkout-layout"><section className="panel checkout-panel"><div className="panel-heading"><div><h2>Cart items</h2><p>{entries.length} products · {cartCount} units reserved</p></div></div>{entries.length?entries.map(([itemId,qty])=>{const item=items.find(candidate=>candidate.id===itemId);if(!item)return null;return <div className="checkout-row" key={itemId}><span className="item-avatar">{item.name[0]}</span><div><strong>{item.name}</strong><small>{qty} {formatUnit(qty, item.unit)} in cart</small></div><div className="quantity-stepper"><button aria-label={`Decrease ${item.name}`} onClick={()=>decreaseCartItem(itemId)}><Minus/></button><span>{qty}</span><button aria-label={`Increase ${item.name}`} disabled={item.quantity<=0} onClick={()=>addCartItem(itemId)}><Plus/></button></div><button className="icon-button danger" aria-label={`Remove ${item.name}`} onClick={()=>removeCartItem(itemId)}><Trash2/></button></div>}):<div className="empty-state"><ShoppingBag/><h3>Your cart is empty</h3><p>Add available items from the shop.</p></div>}</section><aside className="panel order-summary"><h2>Cart summary</h2><div><span>Reserved units</span><strong>{cartCount}</strong></div><div><span>Products</span><strong>{entries.length}</strong></div><hr/><small>Items can be removed and returned to available stock at any time. No purchase request is required.</small></aside></div></div>;
}
