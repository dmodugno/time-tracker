import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

export function Settings({ isOpen, onClose }) {
  const { dailyTarget, setDailyTargetHours } = useSettings();
  const [tempValue, setTempValue] = useState(dailyTarget);

  // Update temp value when dailyTarget changes
  useEffect(() => {
    setTempValue(dailyTarget);
  }, [dailyTarget]);

  const handleSave = () => {
    setDailyTargetHours(tempValue);
    onClose();
  };

  const handleCancel = () => {
    setTempValue(dailyTarget); // Reset to current value
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <label htmlFor="daily-target" className="block text-sm font-medium text-gray-700 mb-2">
                Daily Target Hours
              </label>
              <input
                id="daily-target"
                type="number"
                min="0.5"
                step="0.5"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                Set your daily target hours for flex balance calculations. Default is 9 hours.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
