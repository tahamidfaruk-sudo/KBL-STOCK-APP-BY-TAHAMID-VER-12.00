/**
 * Universal Date Formatting Utility
 * Formats dates into "DD MMM YY" (e.g. "02 OCT 26")
 */
export const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();
  if (!cleanStr || cleanStr === '-' || cleanStr === 'null' || cleanStr === 'undefined') return '-';

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Check if string matches YYYY-MM-DD or YYYY/MM/DD
  const datePart = cleanStr.split('T')[0];
  const parts = datePart.includes('-')
    ? datePart.split('-')
    : datePart.includes('/')
    ? datePart.split('/')
    : [];

  if (parts.length === 3) {
    // If format is YYYY-MM-DD
    if (parts[0].length === 4) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (monthNum >= 1 && monthNum <= 12 && !isNaN(day)) {
        const paddedDay = day < 10 ? `0${day}` : `${day}`;
        const shortYear = year.slice(-2);
        return `${paddedDay} ${months[monthNum - 1]} ${shortYear}`;
      }
    }
    // If format is DD-MM-YYYY or DD/MM/YYYY
    else if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10);
      const year = parts[2];
      if (monthNum >= 1 && monthNum <= 12 && !isNaN(day)) {
        const paddedDay = day < 10 ? `0${day}` : `${day}`;
        const shortYear = year.slice(-2);
        return `${paddedDay} ${months[monthNum - 1]} ${shortYear}`;
      }
    }
  }

  // Fallback using JavaScript Date object
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return cleanStr;
  const day = d.getDate();
  const paddedDay = day < 10 ? `0${day}` : `${day}`;
  const shortYear = String(d.getFullYear()).slice(-2);
  return `${paddedDay} ${months[d.getMonth()]} ${shortYear}`;
};

/**
 * Formats dates with time into "DD MMM YY, HH:MM AM/PM" (e.g. "02 OCT 26, 04:30 PM")
 */
export const formatDisplayDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return formatDisplayDate(cleanStr);
  const dateFormatted = formatDisplayDate(cleanStr);
  const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  return `${dateFormatted}, ${timeFormatted}`;
};

