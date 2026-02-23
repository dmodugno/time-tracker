import { createContext, useContext, useState, useCallback } from 'react';
import * as csvService from '../services/csvService';

const SessionsContext = createContext(null);

/**
 * Hook to use the sessions context
 */
export function useSessions() {
  const context = useContext(SessionsContext);
  if (!context) {
    throw new Error('useSessions must be used within SessionsProvider');
  }
  return context;
}

/**
 * Provider component for sessions state management
 */
export function SessionsProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Open a file (new or existing)
   */
  const openFile = useCallback(async (createNew = false) => {
    setLoading(true);
    setError(null);
    try {
      const name = await csvService.openFile(createNew);
      setFileName(name);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload sessions from the CSV file
   */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await csvService.readSessions();
      // Sort by date descending, then by start time descending
      data.sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.start_time.localeCompare(a.start_time);
      });
      setSessions(data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new session
   */
  const addSession = useCallback(async (session) => {
    setLoading(true);
    setError(null);
    try {
      await csvService.appendSession(session);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reload]);

  /**
   * Update an existing session
   */
  const updateSession = useCallback(async (id, changes) => {
    setLoading(true);
    setError(null);
    try {
      await csvService.updateSession(id, changes);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reload]);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await csvService.deleteSession(id);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reload]);

  /**
   * Merge sessions from another CSV file
   */
  const mergeFromFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await csvService.mergeFromFile();
      await reload();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reload]);

  /**
   * Get sessions for today
   */
  const getTodaySessions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.date === today);
  }, [sessions]);

  /**
   * Get sessions for a specific date range
   */
  const getSessionsInRange = useCallback((startDate, endDate) => {
    return sessions.filter(s => s.date >= startDate && s.date <= endDate);
  }, [sessions]);

  const value = {
    sessions,
    fileName,
    loading,
    error,
    openFile,
    reload,
    addSession,
    updateSession,
    deleteSession,
    mergeFromFile,
    getTodaySessions,
    getSessionsInRange,
    hasFile: fileName !== null
  };

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}
