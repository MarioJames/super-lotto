/**
 * localStorage utility functions for the Lottery Agent system
 * Handles persistence of lottery state with graceful fallback
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { LotteryState, STORAGE_KEYS } from '@/types';

/**
 * Default empty lottery state
 */
export const DEFAULT_LOTTERY_STATE: LotteryState = {
  participants: [],
  rounds: [],
  winners: [],
  currentRoundIndex: 0,
};

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save lottery state to localStorage
 * Returns true if successful, false if localStorage is unavailable
 */
export function saveLotteryState(state: LotteryState): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available. State will not be persisted.');
    return false;
  }

  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEYS.LOTTERY_STATE, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save lottery state:', error);
    return false;
  }
}

/**
 * Load lottery state from localStorage
 * Returns the stored state or default state if unavailable/invalid
 */
export function loadLotteryState(): LotteryState {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available. Using default state.');
    return { ...DEFAULT_LOTTERY_STATE };
  }

  try {
    const serialized = window.localStorage.getItem(STORAGE_KEYS.LOTTERY_STATE);
    if (!serialized) {
      return { ...DEFAULT_LOTTERY_STATE };
    }

    const parsed = JSON.parse(serialized) as LotteryState;

    // Validate the parsed state has required properties
    if (
      !Array.isArray(parsed.participants) ||
      !Array.isArray(parsed.rounds) ||
      !Array.isArray(parsed.winners) ||
      typeof parsed.currentRoundIndex !== 'number'
    ) {
      console.warn('Invalid lottery state in localStorage. Using default state.');
      return { ...DEFAULT_LOTTERY_STATE };
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load lottery state:', error);
    return { ...DEFAULT_LOTTERY_STATE };
  }
}

/**
 * Clear lottery state from localStorage
 */
export function clearLotteryState(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.LOTTERY_STATE);
    return true;
  } catch (error) {
    console.error('Failed to clear lottery state:', error);
    return false;
  }
}
