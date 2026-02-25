import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'daily_target_hours';
const DEFAULT_TARGET = 9;

/**
 * Custom hook for managing app settings with localStorage persistence
 * @returns {Object} Settings state and controls
 */
export function useSettings() {
  const [dailyTarget, setDailyTarget] = useState(DEFAULT_TARGET);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      // Validate: must be a positive number, fallback to default if invalid
      if (!isNaN(parsed) && parsed > 0) {
        setDailyTarget(parsed);
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
    localStorage.setItem(SETTINGS_KEY, finalValue.toString());
  };

  /**
   * Get daily target hours (guaranteed to be valid)
   * @returns {number} Daily target hours
   */
  const getDailyTargetHours = () => {
    return dailyTarget;
  };

  return {
    dailyTarget,
    setDailyTargetHours,
    getDailyTargetHours
  };
}
