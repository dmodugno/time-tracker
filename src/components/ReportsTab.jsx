import { useMemo } from 'react';
import { useSessions } from '../contexts/SessionsContext';

export function ReportsTab() {
  const { sessions, hasFile } = useSessions();

  // Calculate date ranges
  const ranges = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Start of this week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust if Sunday (0) or find Monday
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    const weekStart = startOfWeek.toISOString().split('T')[0];

    // Start of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Start of this year
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    return {
      week: { start: weekStart, end: today },
      month: { start: monthStart, end: today },
      year: { start: yearStart, end: today }
    };
  }, []);

  // Calculate totals for each period
  const totals = useMemo(() => {
    const filterByRange = (start, end) => {
      return sessions
        .filter(s => s.date >= start && s.date <= end)
        .reduce((sum, s) => sum + s.duration_hours, 0);
    };

    return {
      week: filterByRange(ranges.week.start, ranges.week.end),
      month: filterByRange(ranges.month.start, ranges.month.end),
      year: filterByRange(ranges.year.start, ranges.year.end)
    };
  }, [sessions, ranges]);

  // Count sessions for each period
  const counts = useMemo(() => {
    const countByRange = (start, end) => {
      return sessions.filter(s => s.date >= start && s.date <= end).length;
    };

    return {
      week: countByRange(ranges.week.start, ranges.week.end),
      month: countByRange(ranges.month.start, ranges.month.end),
      year: countByRange(ranges.year.start, ranges.year.end)
    };
  }, [sessions, ranges]);

  const ReportCard = ({ title, hours, sessions, period, color }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-t-4 ${color}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="space-y-3">
        <div>
          <p className="text-4xl font-bold text-gray-900">{hours.toFixed(2)}</p>
          <p className="text-sm text-gray-500">hours</p>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <p className="text-2xl font-semibold text-gray-700">{sessions}</p>
          <p className="text-sm text-gray-500">sessions</p>
        </div>
        {hours > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-lg font-medium text-gray-600">
              {(hours / (sessions || 1)).toFixed(2)} hrs/session
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        {period}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

      {!hasFile ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800">No file selected. Please open or create a CSV file from the app header.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No sessions recorded yet. Start tracking time to see reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard
            title="This Week"
            hours={totals.week}
            sessions={counts.week}
            period={`${ranges.week.start} to ${ranges.week.end}`}
            color="border-blue-500"
          />
          <ReportCard
            title="This Month"
            hours={totals.month}
            sessions={counts.month}
            period={`${ranges.month.start} to ${ranges.month.end}`}
            color="border-green-500"
          />
          <ReportCard
            title="This Year"
            hours={totals.year}
            sessions={counts.year}
            period={`${ranges.year.start} to ${ranges.year.end}`}
            color="border-purple-500"
          />
        </div>
      )}

      {/* Additional stats */}
      {hasFile && sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">All Time Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {sessions.reduce((sum, s) => sum + s.duration_hours, 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Total Hours</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
              <p className="text-sm text-gray-500">Total Sessions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {(sessions.reduce((sum, s) => sum + s.duration_hours, 0) / sessions.length).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Avg Hours/Session</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {Math.max(...sessions.map(s => s.duration_hours)).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Longest Session</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
