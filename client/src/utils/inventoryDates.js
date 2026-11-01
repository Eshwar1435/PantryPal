const DAY_MS = 86400000;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntilExpiry(expiryDate, today = new Date()) {
  if (!expiryDate) return null;
  const expiryKey = String(expiryDate).slice(0, 10);
  const expiry = new Date(`${expiryKey}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;
  const todayKey = getLocalDateKey(today);
  const todayStart = new Date(`${todayKey}T00:00:00`);
  return Math.ceil((expiry.getTime() - todayStart.getTime()) / DAY_MS);
}

export function formatExpiryDate(expiryDate) {
  if (!expiryDate) return 'No expiry date';
  const match = String(expiryDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 'No expiry date';
  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  const parsedDate = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
  if (
    monthIndex < 0 ||
    monthIndex > 11 ||
    parsedDate.getUTCFullYear() !== Number(year) ||
    parsedDate.getUTCMonth() !== monthIndex ||
    parsedDate.getUTCDate() !== Number(day)
  ) {
    return 'No expiry date';
  }
  return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
}
