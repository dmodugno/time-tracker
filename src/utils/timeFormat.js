/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM or HH:MM:SS format
 * @returns {string} - Time in 12-hour format with AM/PM (e.g., "3:04 PM")
 */
export function formatTime12Hour(time24) {
  if (!time24) return '';

  const parts = time24.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${hours}:${minutes} ${ampm}`;
}
