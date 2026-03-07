/**
 * Convert Date object to local YYYY-MM-DD string (no timezone conversion)
 * @param {Date} date
 * @returns {string}
 */
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is a weekday (Mon-Fri)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} - True if weekday, false if weekend
 */
function isWeekday(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

/**
 * Group sessions by date
 * @param {Array} sessions - Array of session objects
 * @returns {Object} - Date-keyed object of session arrays
 */
export function groupSessionsByDate(sessions) {
  const grouped = {};
  sessions.forEach(session => {
    if (!grouped[session.date]) {
      grouped[session.date] = [];
    }
    grouped[session.date].push(session);
  });
  return grouped;
}

/**
 * Calculate daily balance for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} sessionsForDate - Sessions for a single date
 * @param {number} dailyTarget - Daily target hours
 * @returns {number} - Balance in hours (can be negative)
 */
export function calculateDailyBalance(date, sessionsForDate, dailyTarget) {
  const isWeekdayDate = isWeekday(date);

  // Check if this date has a day_off entry
  const hasDayOff = sessionsForDate.some(s => s.type === 'day_off');
  if (hasDayOff) {
    return 0; // No deficit, no surplus for day off
  }

  // Calculate total work hours for the day
  const totalHours = sessionsForDate
    .filter(s => s.type === 'work')
    .reduce((sum, s) => sum + s.duration_hours, 0);

  if (isWeekdayDate) {
    // Weekdays: balance = hours - target
    return totalHours - dailyTarget;
  } else {
    // Weekends: pure bonus (no target to meet)
    return totalHours;
  }
}

/**
 * Calculate cumulative balance for sessions within a date range
 * @param {Array} sessions - All sessions
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number} dailyTarget - Daily target hours
 * @returns {Object} - { totalHours, balance }
 */
export function calculatePeriodBalance(sessions, startDate, endDate, dailyTarget) {
  const periodSessions = sessions.filter(s => s.date >= startDate && s.date <= endDate);
  const grouped = groupSessionsByDate(periodSessions);

  let totalHours = 0;
  let balance = 0;

  // Generate all dates in the period
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const allDates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDates.push(getLocalDateString(d));
  }

  // Process each date in the period
  allDates.forEach(date => {
    const daysSessions = grouped[date] || [];
    const isWeekdayDate = isWeekday(date);

    if (daysSessions.length === 0 && isWeekdayDate) {
      // Weekday with no entry: deficit of daily target
      balance += -dailyTarget;
    } else if (daysSessions.length > 0) {
      // Has entries: calculate normally
      const dayBalance = calculateDailyBalance(date, daysSessions, dailyTarget);

      // Add work hours to total (don't count day_off hours)
      const dayWorkHours = daysSessions
        .filter(s => s.type === 'work')
        .reduce((sum, s) => sum + s.duration_hours, 0);

      totalHours += dayWorkHours;
      balance += dayBalance;
    }
    // Weekend with no entry: ignored (no deficit, no surplus)
  });

  return { totalHours, balance };
}

/**
 * Format hours as hours and minutes (no sign)
 * @param {number} decimalHours - Hours in decimal format
 * @returns {string} - Formatted string like "9h 12m"
 */
export function formatHoursMinutes(decimalHours) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Format balance as hours and minutes with sign
 * @param {number} balanceHours - Balance in decimal hours
 * @returns {string} - Formatted string like "+2h 30m" or "−0h 45m"
 */
export function formatFlexBalance(balanceHours) {
  const isNegative = balanceHours < 0;
  const absHours = Math.abs(balanceHours);

  const hours = Math.floor(absHours);
  const minutes = Math.round((absHours - hours) * 60);

  const sign = isNegative ? '−' : '+';
  return `${sign}${hours}h ${minutes}m`;
}

/**
 * Get color class for balance display
 * @param {number} balance - Balance in hours
 * @returns {string} - Tailwind color class
 */
export function getFlexBalanceColor(balance) {
  if (balance > 0) return 'text-green-600';
  if (balance < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Get ISO week number for a date
 * @param {Date} date
 * @returns {number} - ISO week number
 */
export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get the start date (Monday) of an ISO week
 * @param {number} year
 * @param {number} week - ISO week number
 * @returns {Date}
 */
export function getISOWeekStartDate(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

/**
 * Get all ISO weeks that overlap with a given month
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @returns {Array} - Array of { weekNumber, startDate, endDate, belongsToMonth }
 */
export function getISOWeeksForMonth(year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // Last day of month

  const weeks = [];
  const startWeek = getISOWeek(monthStart);
  const endWeek = getISOWeek(monthEnd);

  // Handle year boundary
  let currentYear = year;
  if (month === 0 && startWeek > 50) {
    currentYear = year - 1;
  }

  let weekNum = startWeek;
  while (true) {
    const weekStart = getISOWeekStartDate(currentYear, weekNum);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

    // Thursday of the week
    const thursday = new Date(weekStart);
    thursday.setDate(thursday.getDate() + 3);

    // Check if Thursday falls in the target month
    const belongsToMonth = thursday.getMonth() === month && thursday.getFullYear() === year;

    weeks.push({
      weekNumber: weekNum,
      startDate: getLocalDateString(weekStart),
      endDate: getLocalDateString(weekEnd),
      belongsToMonth
    });

    // Stop if we've passed the month
    if (weekStart > monthEnd) break;

    weekNum++;
    if (weekNum > 52) {
      weekNum = 1;
      currentYear++;
    }

    // Safety check
    if (weeks.length > 10) break;
  }

  // Filter to only weeks that belong to this month (Thursday rule)
  return weeks.filter(w => w.belongsToMonth);
}

/**
 * Format date range for display
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string} - Formatted range like "Feb 1 - Feb 7"
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
}

/**
 * Format hours as days, hours, and minutes (no sign)
 * @param {number} decimalHours - Hours in decimal format
 * @param {number} dailyTarget - Hours per day for conversion
 * @returns {string} - Formatted string like "5d 6h 25m"
 */
export function formatDaysHoursMinutes(decimalHours, dailyTarget) {
  const days = Math.floor(decimalHours / dailyTarget);
  const remainingHours = decimalHours - (days * dailyTarget);
  const hours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - hours) * 60);

  return `${days}d ${hours}h ${minutes}m`;
}

/**
 * Format balance as days, hours, and minutes with sign
 * @param {number} balanceHours - Balance in decimal hours
 * @param {number} dailyTarget - Hours per day for conversion
 * @returns {string} - Formatted string like "+2d 4h 25m" or "−0d 6h 15m"
 */
export function formatFlexBalanceDays(balanceHours, dailyTarget) {
  const isNegative = balanceHours < 0;
  const absHours = Math.abs(balanceHours);

  const days = Math.floor(absHours / dailyTarget);
  const remainingHours = absHours - (days * dailyTarget);
  const hours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - hours) * 60);

  const sign = isNegative ? '−' : '+';
  return `${sign}${days}d ${hours}h ${minutes}m`;
}
