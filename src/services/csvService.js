import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

// Module-level variable to store the file handle
let fileHandle = null;

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported() {
  return 'showOpenFilePicker' in window;
}

/**
 * Open an existing CSV file or create a new one
 * @param {boolean} createNew - If true, shows save picker for new file
 * @returns {Promise<string>} - The name of the opened/created file
 */
export async function openFile(createNew = false) {
  try {
    if (createNew) {
      // Create new file
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'time-sessions.csv',
        types: [{
          description: 'CSV Files',
          accept: {
            'text/csv': ['.csv'],
            'text/plain': ['.csv']
          }
        }]
      });

      // Write CSV header to new file
      const writable = await fileHandle.createWritable();
      await writable.write('id,date,start_time,end_time,duration_hours\n');
      await writable.close();
    } else {
      // Open existing file
      [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'CSV Files',
          accept: {
            'text/csv': ['.csv'],
            'text/plain': ['.csv'],
            'application/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
          }
        }],
        multiple: false
      });
    }

    return fileHandle.name;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('File selection cancelled');
    }
    throw error;
  }
}

/**
 * Get the current file name
 * @returns {string|null}
 */
export function getFileName() {
  return fileHandle ? fileHandle.name : null;
}

/**
 * Read all sessions from the CSV file
 * @returns {Promise<Array>} - Array of session objects
 */
export async function readSessions() {
  if (!fileHandle) {
    throw new Error('No file selected. Please open a file first.');
  }

  try {
    const file = await fileHandle.getFile();
    const content = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filter out rows without required fields
          const sessions = results.data
            .filter(row => row.id && row.date)
            .map(row => ({
              id: row.id,
              date: row.date,
              start_time: row.start_time,
              end_time: row.end_time,
              duration_hours: parseFloat(row.duration_hours) || 0
            }));
          resolve(sessions);
        },
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Permission to access file was denied. Please re-open the file.');
    }
    throw error;
  }
}

/**
 * Calculate duration in hours between start and end times
 * @param {string} startTime - HH:MM or HH:MM:SS format
 * @param {string} endTime - HH:MM or HH:MM:SS format
 * @returns {number} - Duration in decimal hours
 */
function calculateDuration(startTime, endTime) {
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);

  const startH = startParts[0];
  const startM = startParts[1];
  const startS = startParts[2] || 0; // Default to 0 if no seconds

  const endH = endParts[0];
  const endM = endParts[1];
  const endS = endParts[2] || 0; // Default to 0 if no seconds

  const startSeconds = startH * 3600 + startM * 60 + startS;
  const endSeconds = endH * 3600 + endM * 60 + endS;

  const durationSeconds = endSeconds - startSeconds;
  return Math.round((durationSeconds / 3600) * 100) / 100; // Round to 2 decimal places
}

/**
 * Write sessions array back to CSV file
 * @param {Array} sessions - Array of session objects
 */
async function writeSessions(sessions) {
  if (!fileHandle) {
    throw new Error('No file selected. Please open a file first.');
  }

  try {
    const csv = Papa.unparse(sessions, {
      columns: ['id', 'date', 'start_time', 'end_time', 'duration_hours']
    });

    const writable = await fileHandle.createWritable();
    await writable.write(csv);
    await writable.close();
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Permission to write to file was denied. Please re-open the file.');
    }
    throw error;
  }
}

/**
 * Append a new session to the CSV file
 * @param {Object} session - Session object (without id, will be generated)
 * @returns {Promise<void>}
 */
export async function appendSession(session) {
  const sessions = await readSessions();

  const newSession = {
    id: uuidv4(),
    date: session.date,
    start_time: session.start_time,
    end_time: session.end_time,
    duration_hours: calculateDuration(session.start_time, session.end_time)
  };

  sessions.push(newSession);
  await writeSessions(sessions);
}

/**
 * Update an existing session
 * @param {string} id - Session ID to update
 * @param {Object} changes - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSession(id, changes) {
  const sessions = await readSessions();

  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error(`Session with id ${id} not found`);
  }

  // Update the session
  sessions[index] = {
    ...sessions[index],
    ...changes
  };

  // Recalculate duration if start or end time changed
  if (changes.start_time || changes.end_time) {
    sessions[index].duration_hours = calculateDuration(
      sessions[index].start_time,
      sessions[index].end_time
    );
  }

  await writeSessions(sessions);
}

/**
 * Delete a session
 * @param {string} id - Session ID to delete
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  const sessions = await readSessions();
  const filtered = sessions.filter(s => s.id !== id);

  if (filtered.length === sessions.length) {
    throw new Error(`Session with id ${id} not found`);
  }

  await writeSessions(filtered);
}

/**
 * Merge sessions from another CSV file into the current file
 * @returns {Promise<{fileName: string, newCount: number}>} - Info about the merge
 */
export async function mergeFromFile() {
  // Check if main file is open
  if (!fileHandle) {
    throw new Error('No file currently open. Please open your main CSV file first.');
  }

  // Open file picker for import file
  let importFileHandle;
  try {
    [importFileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'CSV Files',
        accept: {
          'text/csv': ['.csv'],
          'text/plain': ['.csv'],
          'application/csv': ['.csv'],
          'application/vnd.ms-excel': ['.csv']
        }
      }],
      multiple: false
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('File selection cancelled');
    }
    throw error;
  }

  // Read and parse the import file
  let importSessions;
  try {
    const file = await importFileHandle.getFile();
    const content = await file.text();

    importSessions = await new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const sessions = results.data
            .filter(row => row.id && row.date)
            .map(row => ({
              id: row.id,
              date: row.date,
              start_time: row.start_time,
              end_time: row.end_time,
              duration_hours: parseFloat(row.duration_hours) || 0
            }));
          resolve(sessions);
        },
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    throw new Error(`Failed to read import file: ${error.message}`);
  }

  // Get current sessions
  const currentSessions = await readSessions();

  // Create a Set of existing IDs for fast lookup
  const existingIds = new Set(currentSessions.map(s => s.id));

  // Filter out sessions that already exist (deduplicate by id)
  const newSessions = importSessions.filter(s => !existingIds.has(s.id));

  // If no new sessions, return early
  if (newSessions.length === 0) {
    return {
      fileName: importFileHandle.name,
      newCount: 0
    };
  }

  // Merge and sort
  const mergedSessions = [...currentSessions, ...newSessions];

  // Sort by date ascending, then by start_time ascending
  mergedSessions.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.start_time.localeCompare(b.start_time);
  });

  // Write back to main file
  await writeSessions(mergedSessions);

  return {
    fileName: importFileHandle.name,
    newCount: newSessions.length
  };
}
