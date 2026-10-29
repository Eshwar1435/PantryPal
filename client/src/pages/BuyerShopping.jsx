import { Filter, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext.jsx';

const prices = { 'Basmati Rice': 180, Eggs: 84, Milk: 75, Tomatoes: 60, 'Cooking Oil': 320, 'Turmeric Powder': 45, 'Instant Noodles': 120, 'Fresh Bread': 55, 'Red Apples': 180, 'Coffee Powder': 240, 'Black Tea': 150, Potatoes: 40, Onions: 45, Curd: 60, Sugar: 55, Pasta: 110, Biscuits: 80, 'Wheat Flour': 55, 'Idli Rice': 80, 'Brown Rice': 110, 'Poha': 65, 'Ragi Flour': 90, 'Millet Flour': 95, 'Toor Dal': 140, 'Moong Dal': 135, 'Chana Dal': 120, 'Chickpeas': 110, 'Masoor Dal': 125, 'Urad Dal': 145, 'Sunflower Oil': 160, 'Groundnut Oil': 230, 'Mustard Oil': 180, 'Coconut Oil': 260, 'Olive Oil': 450, Ghee: 560 };
const productArt = {
  'Sunflower Oil': ['🌻', '#f5b94c', '#fff3c4'], 'Groundnut Oil': ['🥜', '#b87935', '#f4dfbd'],
  'Mustard Oil': ['🌼', '#e0a629', '#fff0a8'], 'Coconut Oil': ['🥥', '#6d9b71', '#e8f0dc'],
  'Olive Oil': ['🫒', '#738b3b', '#dce8b5'], 'Cooking Oil': ['🛢️', '#dca93e', '#f7ecc8'],
  Pasta: ['🍝', '#d9a25f', '#fff0cf'],
  'Ragi Flour': ['🌾', '#9a6a43', '#ead4bd'], 'Millet Flour': ['🌾', '#d1ad63', '#f3e8bd'],
  'Toor Dal': ['🫘', '#d8a11f', '#fff1c2'], 'Moong Dal': ['🫘', '#9bbf50', '#edf4cf'],
  'Chana Dal': ['🫘', '#e0b44a', '#fff0c9'],
  'Masoor Dal': ['🫘', '#d97857', '#f6d5c7'], 'Urad Dal': ['🫘', '#59606a', '#dddde0'],
  'Basmati Rice': ['🌾', '#d8c58d', '#f7f1d7'], Milk: ['🥛', '#8fc9df', '#edf7fb'],
  Eggs: ['🥚', '#d8a35d', '#f7eed7'], Tomatoes: ['🍅', '#dc6a5e', '#f8ddd7'],
  'Turmeric Powder': ['🟡', '#dfad33', '#f7e8ad'], 'Instant Noodles': ['🍜', '#e8ae58', '#f9e6c8'],
  'Fresh Bread': ['🍞', '#bc8150', '#f1d9bc'], 'Red Apples': ['🍎', '#c95050', '#f4c8c4'],
  'Coffee Powder': ['☕', '#795442', '#dfcbc0'], 'Black Tea': ['🍵', '#7d9b63', '#dae5cd'],
  Potatoes: ['🥔', '#b98a55', '#ead9c2'], Onions: ['🧅', '#ae749d', '#ebdbe6'],
  Curd: ['🥣', '#8fc4c7', '#e6f2f2'], Sugar: ['🧂', '#cbd1d2', '#f5f6f6'],
  Biscuits: ['🍪', '#bd8749', '#efd9b8'], 'Wheat Flour': ['🌾', '#c7a36b', '#f1e5c7'],
  'Idli Rice': ['🍚', '#d6d1bc', '#f7f5e9'], 'Brown Rice': ['🌾', '#9b7650', '#e8d7c1'],
  Poha: ['🌾', '#d5cda8', '#f2efdc'], Ghee: ['🧈', '#dfa93c', '#fff0b9'],
  Salt: ['🧂', '#bfc9cb', '#f3f5f5'], 'Green Chillies': ['🌶️', '#5e9c54', '#dcecca'],
  Bananas: ['🍌', '#e5bd46', '#fbefbd'], Chickpeas: ['🫘', '#d29b50', '#f6e3c0']
};

function ProductArtwork({ item }) {
  const art = productArt[item.name] || ['🛒', '#d6e4db', '#f4f7f5'];
  if (item.image) return <><img className="product-image" src={item.image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling?.removeAttribute('hidden'); }} /><div className="product-artwork product-artwork-fallback" hidden><span>{art[0]}</span><strong>{item.name}</strong></div></>;
  return <div className="product-artwork product-artwork-fallback"><span>{art[0]}</span><strong>{item.name}</strong></div>;
}

const formatUnit = (quantity, unit) => {
 if (unit === 'litres') return quantity === 1 ? 'litre' : 'litres';
 if (unit === 'pcs') return quantity === 1 ? 'piece' : 'pieces';
 return unit;
};
export default function BuyerShopping(){
 const { items, cart, cartCount, addCartItem, decreaseCartItem } = usePantry(); const navigate=useNavigate();
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('All');
 const [stock, setStock] = useState('All');
 const [filtersOpen, setFiltersOpen] = useState(false);
 const products=items.filter(item=>item.pantryId==='p1');
 const categories=['All', ...new Set(products.map(item=>item.category))];
 const filtered=useMemo(()=>products.filter(item=>{
   const matchesSearch=item.name.toLowerCase().includes(search.trim().toLowerCase());
   const matchesCategory=category==='All'||item.category===category;
   const matchesStock=stock==='All'||(stock==='In stock'&&item.quantity>0)||(stock==='Out of stock'&&item.quantity<=0)||(stock==='Low stock'&&item.quantity<=item.lowStockThreshold);
   return matchesSearch&&matchesCategory&&matchesStock;
 }),[products,search,category,stock]);
 const clearFilters=()=>{setSearch('');setCategory('All');setStock('All');};
 return <div className="page"><div className="page-heading"><div><p className="eyebrow">Buyer portal</p><h1>Shop pantry items</h1><p>Available pantry stock updates instantly as items are added or removed from your cart.</p></div><button className="btn" disabled={!cartCount} onClick={()=>navigate('/buyer/orders')}><ShoppingCart size={18}/> View cart ({cartCount})</button></div><div className="availability-note"><span/>Stock availability is reserved temporarily in your cart</div>
 <div className="shop-toolbar"><label className="search-field"><Search size={18}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search pantry items..."/></label><button className={`btn secondary filter-toggle ${filtersOpen?'active':''}`} type="button" onClick={()=>setFiltersOpen(open=>!open)}><Filter size={17}/> Filter{(category!== 'All'||stock!=='All')&&<span className="filter-count">{[category!=='All',stock!=='All'].filter(Boolean).length}</span>}</button></div>
 {filtersOpen&&<div className="shop-filter-panel"><label>Category<select value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(value=><option key={value}>{value}</option>)}</select></label><label>Availability<select value={stock} onChange={event=>setStock(event.target.value)}><option>All</option><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></label><button className="icon-button filter-close" type="button" aria-label="Clear filters" onClick={clearFilters}><X size={18}/></button></div>}
 <div className="shop-results-count">Showing {filtered.length} of {products.length} items{(search||category!== 'All'||stock!== 'All')&&<button type="button" onClick={clearFilters}>Clear filters</button>}</div>
 <div className="product-grid">{filtered.map(item=>{const amount=cart[item.id]||0;const outOfStock=item.quantity<=0;return <article className="product-card" key={item.id}><div className="product-image-wrap"><ProductArtwork item={item} /></div><span className="product-category">{item.category}</span><h2>{item.name}</h2><p>{item.quantity} {formatUnit(item.quantity, item.unit)} available · <strong className={outOfStock?'negative':'in-stock'}>{outOfStock?'Out of stock':'In stock'}</strong></p><div className="product-bottom"><strong>₹{prices[item.name] || 50}</strong><div className="quantity-stepper">{amount>0&&<><button aria-label={`Remove one ${item.name}`} onClick={()=>decreaseCartItem(item.id)}><Minus/></button><span>{amount}</span></>}<button aria-label={`Add ${item.name} to cart`} disabled={outOfStock} onClick={()=>addCartItem(item.id)}><Plus/></button></div></div></article>})}</div>
 {!filtered.length&&<div className="empty-state"><ShoppingCart size={28}/><h3>No items match these filters</h3><p>Change the category, availability, or search text.</p><button className="btn secondary" onClick={clearFilters}>Clear filters</button></div>}
 </div>;
}
