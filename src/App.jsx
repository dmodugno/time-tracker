import { useState } from 'react';
import { SessionsProvider, useSessions } from './contexts/SessionsContext';
import { TimerTab } from './components/TimerTab';
import { SessionsTab } from './components/SessionsTab';
import { ReportsTab } from './components/ReportsTab';
import { isFileSystemAccessSupported } from './services/csvService';

function AppContent() {
  const [activeTab, setActiveTab] = useState('timer');
  const { openFile, fileName, hasFile } = useSessions();

  const handleOpenFile = async () => {
    try {
      await openFile(false);
    } catch (error) {
      if (error.message !== 'File selection cancelled') {
        alert(`Failed to open file: ${error.message}`);
      }
    }
  };

  const handleCreateFile = async () => {
    try {
      await openFile(true);
    } catch (error) {
      if (error.message !== 'File selection cancelled') {
        alert(`Failed to create file: ${error.message}`);
      }
    }
  };

  const tabs = [
    { id: 'timer', label: 'Timer' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>

            {!isFileSystemAccessSupported() ? (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <p className="text-sm text-red-800">
                  File System Access API not supported in this browser.
                  Please use Chrome or Edge.
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                {!hasFile ? (
                  <>
                    <button
                      onClick={handleOpenFile}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Open CSV
                    </button>
                    <button
                      onClick={handleCreateFile}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Create New CSV
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleOpenFile}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Change File
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="bg-transparent">
          {activeTab === 'timer' && <TimerTab />}
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Time Tracker - All data stored in your CSV file</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <SessionsProvider>
      <AppContent />
    </SessionsProvider>
  );
}

export default App;
