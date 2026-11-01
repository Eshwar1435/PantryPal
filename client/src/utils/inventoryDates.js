const DAY_MS = 86400000;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntilExpiry(expiryDate, today = new Date()) {
  if (!expiryDate) return null;
  const expiry = new Date(`${expiryDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;
  const todayKey = getLocalDateKey(today);
  const todayStart = new Date(`${todayKey}T00:00:00`);
  return Math.ceil((expiry.getTime() - todayStart.getTime()) / DAY_MS);
}
