import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'timer_start_time';

/**
 * Custom hook for managing timer state with localStorage persistence
 * @returns {Object} Timer state and controls
 */
export function useTimer() {
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  // On mount, check if there's a saved start time
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedTime = new Date(saved);
      setStartTime(savedTime);
    }
  }, []);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (startTime) {
      // Calculate initial elapsed time
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));

      // Set up interval to update every second
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Clear interval when timer stops
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setElapsed(0);
    }
  }, [startTime]);

  /**
   * Start the timer
   */
  const start = () => {
    const now = new Date();
    setStartTime(now);
    localStorage.setItem(STORAGE_KEY, now.toISOString());
  };

  /**
   * Stop the timer and return session data
   * @returns {Object} Session data with date, start_time, end_time
   */
  const stop = () => {
    if (!startTime) return null;

    const endTime = new Date();

    // Format times for CSV
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`; // Returns HH:MM
    };

    const formatDate = (date) => {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    };

    const session = {
      date: formatDate(startTime),
      start_time: formatTime(startTime),
      end_time: formatTime(endTime)
    };

    // Clear timer state
    setStartTime(null);
    setElapsed(0);
    localStorage.removeItem(STORAGE_KEY);

    return session;
  };

  /**
   * Format elapsed seconds as HH:MM:SS
   * @param {number} seconds
   * @returns {string}
   */
  const formatElapsed = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map(val => String(val).padStart(2, '0'))
      .join(':');
  };

  return {
    isRunning: startTime !== null,
    elapsed,
    elapsedFormatted: formatElapsed(elapsed),
    start,
    stop
  };
}
