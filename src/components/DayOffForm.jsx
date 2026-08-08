import { useState } from 'react';

const MAX_RANGE_DAYS = 90;

function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (current <= last) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function DayOffForm({ sessions, onAddDayOff, onCancel }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const rangeEnd = endDate || selectedDate;

    if (rangeEnd < selectedDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    const dates = getDateRange(selectedDate, rangeEnd);

    if (dates.length > MAX_RANGE_DAYS) {
      setError(`That range is ${dates.length} days - please keep it under ${MAX_RANGE_DAYS} days.`);
      return;
    }

    // Check for duplicate day off entries across the whole range
    const conflicts = dates.filter(
      date => sessions.some(s => s.date === date && s.type === 'day_off')
    );

    if (conflicts.length > 0) {
      setError(
        conflicts.length === 1
          ? `A day off entry already exists for ${conflicts[0]}.`
          : `Day off entries already exist for: ${conflicts.join(', ')}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      for (const date of dates) {
        await onAddDayOff({
          date,
          start_time: '',
          end_time: '',
          duration_hours: 0,
          type: 'day_off'
        });
      }
      onCancel(); // Close form on success
    } catch (err) {
      setError(err.message || 'Failed to add day off');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Day Off</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="day-off-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="day-off-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label htmlFor="day-off-end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End date (optional)
          </label>
          <input
            id="day-off-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={selectedDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <p className="-mt-2 mb-4 text-xs text-gray-500">
        Leave end date blank to log a single day. Set it to log every day from the date above
        through this one (no deficit in flex balance).
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging...' : 'Log Day Off'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
