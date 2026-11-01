import { daysUntilExpiry } from '../utils/inventoryDates.js';

// Works out which statuses apply to an item. An item can have more than one.
export function getStatuses(item) {
  const daysLeft = daysUntilExpiry(item.expiryDate);

  const statuses = [];
  if (daysLeft !== null && daysLeft < 0) statuses.push('Expired');
  else if (daysLeft !== null && daysLeft <= 7) statuses.push('Expiring Soon');
  if (item.quantity <= item.lowStockThreshold) statuses.push('Low Stock');
  if (statuses.length === 0) statuses.push('OK');
  return statuses;
}

const classFor = { 'Expired': 'danger', 'Expiring Soon': 'warn', 'Low Stock': 'warn', 'OK': 'ok' };

// Shows one coloured badge per status.
export default function StatusBadge({ item }) {
  return (
    <>
      {getStatuses(item).map((s) => (
        <span key={s} className={`badge badge-${classFor[s]}`}>{s}</span>
      ))}
    </>
  );
}
