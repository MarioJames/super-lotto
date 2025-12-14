'use client';

/**
 * LotteryContext - State management for the Lottery Agent system
 * Provides participants, rounds, winners state and related methods
 *
 * Requirements: 2.4, 3.4, 4.3, 4.4, 7.4
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { Participant, LotteryRound, Winner, LotteryState } from '@/types';
import {
  saveLotteryState,
  loadLotteryState,
  DEFAULT_LOTTERY_STATE,
} from '@/lib/storage';
import {
  getEligibleParticipants as getEligible,
  generateExportFilename,
} from '@/lib/lottery';

/**
 * LotteryContextValue - Context value interface
 */
export interface LotteryContextValue {
  participants: Participant[];
  rounds: LotteryRound[];
  winners: Winner[];
  currentRoundIndex: number;
  setParticipants: (participants: Participant[]) => void;
  addRound: (round: LotteryRound) => void;
  addWinners: (roundId: string, winners: Winner[]) => void;
  getEligibleParticipants: () => Participant[];
  exportWinners: (roundId: string) => void;
  resetState: () => void;
}

const LotteryContext = createContext<LotteryContextValue | null>(null);

interface LotteryProviderProps {
  children: ReactNode;
}

/**
 * LotteryProvider - Context provider component
 * Initializes state from localStorage on mount and persists changes
 */
export function LotteryProvider({ children }: LotteryProviderProps) {
  // Use lazy initializer to load state from localStorage on first render
  const [state, setState] = useState<LotteryState>(() => loadLotteryState());
  // Use ref to track initialization without triggering re-renders
  const isInitializedRef = useRef(false);

  // Persist state to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (isInitializedRef.current) {
      saveLotteryState(state);
    } else {
      // Mark as initialized after first render
      isInitializedRef.current = true;
    }
  }, [state]);


  /**
   * Set participants list
   * Requirements: 2.4
   */
  const setParticipants = useCallback((participants: Participant[]) => {
    setState((prev) => ({
      ...prev,
      participants,
    }));
  }, []);

  /**
   * Add a new lottery round
   * Requirements: 3.4
   */
  const addRound = useCallback((round: LotteryRound) => {
    setState((prev) => ({
      ...prev,
      rounds: [...prev.rounds, round],
    }));
  }, []);

  /**
   * Add winners for a specific round and mark round as completed
   * Requirements: 4.4
   */
  const addWinners = useCallback((roundId: string, newWinners: Winner[]) => {
    setState((prev) => ({
      ...prev,
      winners: [...prev.winners, ...newWinners],
      rounds: prev.rounds.map((round) =>
        round.id === roundId ? { ...round, status: 'completed' as const } : round
      ),
      currentRoundIndex: prev.currentRoundIndex + 1,
    }));
  }, []);

  /**
   * Get participants who haven't won yet
   * Requirements: 4.3
   */
  const getEligibleParticipants = useCallback(() => {
    return getEligible(state.participants, state.winners);
  }, [state.participants, state.winners]);

  /**
   * Export winners for a specific round as CSV download
   * Requirements: 5.1, 5.2, 5.3
   */
  const exportWinners = useCallback(
    (roundId: string) => {
      const round = state.rounds.find((r) => r.id === roundId);
      if (!round) {
        console.error('Round not found:', roundId);
        return;
      }

      const roundWinners = state.winners.filter((w) => w.roundId === roundId);
      if (roundWinners.length === 0) {
        console.warn('No winners found for round:', roundId);
        return;
      }

      // Generate CSV content
      const headers = ['Name', 'Prize', 'Won At'];
      const rows = roundWinners.map((w) => [
        w.participantName,
        w.prizeName,
        new Date(w.wonAt).toLocaleString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generateExportFilename(round)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [state.rounds, state.winners]
  );

  /**
   * Reset state to default
   */
  const resetState = useCallback(() => {
    setState(DEFAULT_LOTTERY_STATE);
  }, []);

  const value = useMemo<LotteryContextValue>(
    () => ({
      participants: state.participants,
      rounds: state.rounds,
      winners: state.winners,
      currentRoundIndex: state.currentRoundIndex,
      setParticipants,
      addRound,
      addWinners,
      getEligibleParticipants,
      exportWinners,
      resetState,
    }),
    [
      state.participants,
      state.rounds,
      state.winners,
      state.currentRoundIndex,
      setParticipants,
      addRound,
      addWinners,
      getEligibleParticipants,
      exportWinners,
      resetState,
    ]
  );

  return (
    <LotteryContext.Provider value={value}>{children}</LotteryContext.Provider>
  );
}

/**
 * useLottery - Custom hook to access lottery context
 * Throws error if used outside of LotteryProvider
 */
export function useLottery(): LotteryContextValue {
  const context = useContext(LotteryContext);
  if (!context) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
}
