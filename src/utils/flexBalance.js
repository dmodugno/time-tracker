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
 * @param {Array} sessionsForDate - Sessions for a single date
 * @param {number} dailyTarget - Daily target hours
 * @returns {number} - Balance in hours (can be negative)
 */
export function calculateDailyBalance(sessionsForDate, dailyTarget) {
  // Check if this date has a day_off entry
  const hasDayOff = sessionsForDate.some(s => s.type === 'day_off');
  if (hasDayOff) {
    return 0; // No deficit, no surplus for day off
  }

  // Calculate total work hours for the day
  const totalHours = sessionsForDate
    .filter(s => s.type === 'work')
    .reduce((sum, s) => sum + s.duration_hours, 0);

  return totalHours - dailyTarget;
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

  Object.keys(grouped).forEach(date => {
    const daysSessions = grouped[date];
    const dayBalance = calculateDailyBalance(daysSessions, dailyTarget);

    // Add work hours to total (don't count day_off hours)
    const dayWorkHours = daysSessions
      .filter(s => s.type === 'work')
      .reduce((sum, s) => sum + s.duration_hours, 0);

    totalHours += dayWorkHours;
    balance += dayBalance;
  });

  return { totalHours, balance };
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
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
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
