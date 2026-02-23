import { useTimer } from '../hooks/useTimer';
import { useSessions } from '../contexts/SessionsContext';
import { formatTime12Hour } from '../utils/timeFormat';

export function TimerTab() {
  const { isRunning, elapsedFormatted, start, stop } = useTimer();
  const { addSession, getTodaySessions, hasFile, fileName } = useSessions();

  const todaySessions = getTodaySessions();

  const handleStart = () => {
    start();
  };

  const handleStop = async () => {
    const sessionData = stop();
    if (sessionData) {
      try {
        await addSession(sessionData);
      } catch (error) {
        console.error('Failed to save session:', error);
        alert(`Failed to save session: ${error.message}`);
      }
    }
  };

  // Calculate today's total hours
  const todayTotal = todaySessions.reduce((sum, s) => sum + s.duration_hours, 0).toFixed(2);

  return (
    <div className="space-y-8">
      {/* File status banner */}
      {hasFile ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <span className="font-semibold">File:</span> {fileName}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No file selected. Please open or create a CSV file from the app header.
          </p>
        </div>
      )}

      {/* Timer display */}
      <div className="text-center space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-7xl font-mono font-bold text-gray-800 mb-8">
            {elapsedFormatted}
          </div>

          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={!hasFile}
            className={`
              px-12 py-4 rounded-lg text-xl font-semibold transition-all
              ${isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'}
              ${!hasFile ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
        </div>

        {isRunning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Timer is running. Session will be saved when you stop.
            </p>
          </div>
        )}
      </div>

      {/* Today's sessions */}
      {todaySessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today's Sessions</h3>
            <span className="text-sm font-medium text-gray-600">
              Total: {todayTotal} hours
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todaySessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTime12Hour(session.start_time)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTime12Hour(session.end_time)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {session.duration_hours.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
