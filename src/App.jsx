import { useState } from 'react';
import { SessionsProvider, useSessions } from './contexts/SessionsContext';
import { TimerTab } from './components/TimerTab';
import { SessionsTab } from './components/SessionsTab';
import { ReportsTab } from './components/ReportsTab';
import { Settings } from './components/Settings';
import { isFileSystemAccessSupported } from './services/csvService';

function AppContent() {
  const [activeTab, setActiveTab] = useState('timer');
  const [settingsOpen, setSettingsOpen] = useState(false);
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

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

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
