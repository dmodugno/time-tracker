import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function DayOffForm({ sessions, onAddDayOff, onCancel }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Check for duplicate day off on this date
    const existingDayOff = sessions.find(
      s => s.date === selectedDate && s.type === 'day_off'
    );

    if (existingDayOff) {
      setError('A day off entry already exists for this date.');
      return;
    }

    // Create day off entry
    const dayOffEntry = {
      date: selectedDate,
      start_time: '',
      end_time: '',
      duration_hours: 0,
      type: 'day_off'
    };

    try {
      await onAddDayOff(dayOffEntry);
      onCancel(); // Close form on success
    } catch (err) {
      setError(err.message || 'Failed to add day off');
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

      <div className="mb-4">
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
        <p className="mt-1 text-xs text-gray-500">
          This date will be marked as a day off (no deficit in flex balance)
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Log Day Off
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
