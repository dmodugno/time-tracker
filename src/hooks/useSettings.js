import { useState, useEffect } from 'react';

const DAILY_TARGET_KEY = 'daily_target_hours';
const END_OF_WORKDAY_KEY = 'end_of_workday';
const DEFAULT_TARGET = 9;
const DEFAULT_END_OF_WORKDAY = '18:00';

/**
 * Custom hook for managing app settings with localStorage persistence
 * @returns {Object} Settings state and controls
 */
export function useSettings() {
  const [dailyTarget, setDailyTarget] = useState(DEFAULT_TARGET);
  const [endOfWorkDay, setEndOfWorkDay] = useState(DEFAULT_END_OF_WORKDAY);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTarget = localStorage.getItem(DAILY_TARGET_KEY);
    if (savedTarget) {
      const parsed = parseFloat(savedTarget);
      // Validate: must be a positive number, fallback to default if invalid
      if (!isNaN(parsed) && parsed > 0) {
        setDailyTarget(parsed);
      }
    }

    const savedEndTime = localStorage.getItem(END_OF_WORKDAY_KEY);
    if (savedEndTime) {
      // Validate time format HH:MM
      if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(savedEndTime)) {
        setEndOfWorkDay(savedEndTime);
      }
    }
  }, []);

  /**
   * Update daily target hours
   * @param {number} hours - New target hours
   */
  const setDailyTargetHours = (hours) => {
    const value = parseFloat(hours);
    // Validate and fallback to default if invalid or zero
    const finalValue = !isNaN(value) && value > 0 ? value : DEFAULT_TARGET;
    setDailyTarget(finalValue);
    localStorage.setItem(DAILY_TARGET_KEY, finalValue.toString());
  };

  /**
   * Update end of work day time
   * @param {string} time - Time in HH:MM format
   */
  const setEndOfWorkDayTime = (time) => {
    // Validate time format HH:MM
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setEndOfWorkDay(time);
      localStorage.setItem(END_OF_WORKDAY_KEY, time);
    } else {
      // Fallback to default if invalid
      setEndOfWorkDay(DEFAULT_END_OF_WORKDAY);
      localStorage.setItem(END_OF_WORKDAY_KEY, DEFAULT_END_OF_WORKDAY);
    }
  };

  /**
   * Get daily target hours (guaranteed to be valid)
   * @returns {number} Daily target hours
   */
  const getDailyTargetHours = () => {
    return dailyTarget;
  };

  /**
   * Get end of work day time (guaranteed to be valid)
   * @returns {string} End of work day in HH:MM format
   */
  const getEndOfWorkDay = () => {
    return endOfWorkDay;
  };

  return {
    dailyTarget,
    endOfWorkDay,
    setDailyTargetHours,
    setEndOfWorkDayTime,
    getDailyTargetHours,
    getEndOfWorkDay
  };
}
