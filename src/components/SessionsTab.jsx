import { useState } from 'react';
import { useSessions } from '../contexts/SessionsContext';
import { formatTime12Hour } from '../utils/timeFormat';

export function SessionsTab() {
  const { sessions, updateSession, deleteSession, addSession, mergeFromFile, hasFile } = useSessions();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00'
  });
  const [mergeMessage, setMergeMessage] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  const startEdit = (session) => {
    setEditingId(session.id);
    setEditForm({
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    // Validate end time is after start time
    if (editForm.end_time <= editForm.start_time) {
      alert('End time must be after start time');
      return;
    }

    try {
      await updateSession(id, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      alert(`Failed to update session: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await deleteSession(id);
    } catch (error) {
      alert(`Failed to delete session: ${error.message}`);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();

    // Validate end time is after start time
    if (addForm.end_time <= addForm.start_time) {
      alert('End time must be after start time');
      return;
    }

    try {
      await addSession(addForm);
      setShowAddForm(false);
      setAddForm({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00'
      });
    } catch (error) {
      alert(`Failed to add session: ${error.message}`);
    }
  };

  const handleMerge = async () => {
    // Clear any previous message
    setMergeMessage(null);

    try {
      const result = await mergeFromFile();

      if (result.newCount === 0) {
        setMergeMessage({
          type: 'info',
          text: `No new sessions found in ${result.fileName}`
        });
      } else {
        setMergeMessage({
          type: 'success',
          text: `Merged ${result.newCount} new session${result.newCount === 1 ? '' : 's'} from ${result.fileName}`
        });
      }

      // Clear message after 5 seconds
      setTimeout(() => setMergeMessage(null), 5000);
    } catch (error) {
      if (error.message !== 'File selection cancelled') {
        setMergeMessage({
          type: 'error',
          text: error.message
        });
        // Clear error message after 7 seconds
        setTimeout(() => setMergeMessage(null), 7000);
      }
    }
  };

  // Pagination
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = sessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">All Sessions</h2>
        <div className="flex gap-3">
          <button
            onClick={handleMerge}
            disabled={!hasFile}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${hasFile
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            Import from another file
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={!hasFile}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${hasFile
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            {showAddForm ? 'Cancel' : '+ Add Manual Entry'}
          </button>
        </div>
      </div>

      {/* Merge message */}
      {mergeMessage && (
        <div className={`
          rounded-lg p-4 border
          ${mergeMessage.type === 'success' ? 'bg-green-50 border-green-200' : ''}
          ${mergeMessage.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
          ${mergeMessage.type === 'error' ? 'bg-red-50 border-red-200' : ''}
        `}>
          <p className={`text-sm
            ${mergeMessage.type === 'success' ? 'text-green-800' : ''}
            ${mergeMessage.type === 'info' ? 'text-blue-800' : ''}
            ${mergeMessage.type === 'error' ? 'text-red-800' : ''}
          `}>
            {mergeMessage.text}
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddSession} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Manual Entry</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={addForm.start_time}
                onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={addForm.end_time}
                onChange={(e) => setAddForm({ ...addForm, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            Add Session
          </button>
        </form>
      )}

      {/* Sessions table */}
      {!hasFile ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800">No file selected. Please open or create a CSV file from the app header.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No sessions recorded yet. Start the timer or add a manual entry.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    {editingId === session.id ? (
                      // Edit mode
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="time"
                            value={editForm.start_time}
                            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="time"
                            value={editForm.end_time}
                            onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          (auto)
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => saveEdit(session.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime12Hour(session.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime12Hour(session.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {session.duration_hours.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => startEdit(session)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
