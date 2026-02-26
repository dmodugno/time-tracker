import { useMemo, useState } from 'react';
import { useSessions } from '../contexts/SessionsContext';
import { useSettings } from '../hooks/useSettings';
import {
  calculatePeriodBalance,
  formatFlexBalance,
  getFlexBalanceColor,
  getISOWeeksForMonth,
  formatDateRange
} from '../utils/flexBalance';

// Helper to get local date in YYYY-MM-DD format (no timezone conversion)
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ReportsTab() {
  const { sessions, hasFile } = useSessions();
  const { dailyTarget } = useSettings();
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = current month, -1 = last month, etc.

  // Calculate date ranges
  const ranges = useMemo(() => {
    const now = new Date();
    const today = getLocalDateString(now);

    // Start of this week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust if Sunday (0) or find Monday
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    const weekStart = getLocalDateString(startOfWeek);

    // Start of this month
    const monthStart = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));

    // Start of this year
    const yearStart = getLocalDateString(new Date(now.getFullYear(), 0, 1));

    return {
      today: { start: today, end: today },
      week: { start: weekStart, end: today },
      month: { start: monthStart, end: today },
      year: { start: yearStart, end: today }
    };
  }, []);

  // Calculate totals and balances for each period
  const periodStats = useMemo(() => {
    return {
      today: calculatePeriodBalance(sessions, ranges.today.start, ranges.today.end, dailyTarget),
      week: calculatePeriodBalance(sessions, ranges.week.start, ranges.week.end, dailyTarget),
      month: calculatePeriodBalance(sessions, ranges.month.start, ranges.month.end, dailyTarget),
      year: calculatePeriodBalance(sessions, ranges.year.start, ranges.year.end, dailyTarget)
    };
  }, [sessions, ranges, dailyTarget]);

  // Monthly summary data
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    const weeks = getISOWeeksForMonth(year, month);

    return {
      monthName: targetMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      weeks: weeks.map(week => {
        const weekStats = calculatePeriodBalance(sessions, week.startDate, week.endDate, dailyTarget);
        return {
          ...week,
          ...weekStats
        };
      })
    };
  }, [sessions, currentMonthOffset, dailyTarget]);

  const StatCard = ({ title, totalHours, balance, period, color }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-t-4 ${color}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">
        <div>
          <p className="text-4xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
          <p className="text-sm text-gray-500">hours worked</p>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <p className={`text-2xl font-semibold ${getFlexBalanceColor(balance)}`}>
            {formatFlexBalance(balance)}
          </p>
          <p className="text-sm text-gray-500">flex balance</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        {period}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <div className="text-sm text-gray-600">
          Daily target: <span className="font-semibold">{dailyTarget} hours</span>
        </div>
      </div>

      {!hasFile ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800">No file selected. Please open or create a CSV file from the app header.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No sessions recorded yet. Start tracking time to see reports.</p>
        </div>
      ) : (
        <>
          {/* Flex Time Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today"
              totalHours={periodStats.today.totalHours}
              balance={periodStats.today.balance}
              period={ranges.today.start}
              color="border-blue-500"
            />
            <StatCard
              title="This Week"
              totalHours={periodStats.week.totalHours}
              balance={periodStats.week.balance}
              period={`${ranges.week.start} to ${ranges.week.end}`}
              color="border-green-500"
            />
            <StatCard
              title="This Month"
              totalHours={periodStats.month.totalHours}
              balance={periodStats.month.balance}
              period={`${ranges.month.start} to ${ranges.month.end}`}
              color="border-purple-500"
            />
            <StatCard
              title="This Year"
              totalHours={periodStats.year.totalHours}
              balance={periodStats.year.balance}
              period={`${ranges.year.start} to ${ranges.year.end}`}
              color="border-orange-500"
            />
          </div>

          {/* Monthly Summary */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Summary</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentMonthOffset(prev => prev - 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous month"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[150px] text-center">
                  {monthlySummary.monthName}
                </span>
                <button
                  onClick={() => setCurrentMonthOffset(prev => prev + 1)}
                  disabled={currentMonthOffset >= 0}
                  className={`p-2 rounded-lg transition-colors ${
                    currentMonthOffset >= 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Next month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {monthlySummary.weeks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No data for this month
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Range
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours Worked
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Flex Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlySummary.weeks.map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Week {week.weekNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateRange(week.startDate, week.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {week.totalHours.toFixed(2)} hrs
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getFlexBalanceColor(week.balance)}`}>
                          {formatFlexBalance(week.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
