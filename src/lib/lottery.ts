/**
 * Lottery logic utilities for the Lottery Agent system
 * Handles participant eligibility, round validation, and export
 *
 * Requirements: 4.3, 4.6, 5.3
 */

import { Participant, Winner, LotteryRound } from '@/types';

/**
 * Get eligible participants by excluding previous winners
 *
 * @param participants - All participants
 * @param winners - All winners from previous rounds
 * @returns Array of participants who haven't won yet
 *
 * Requirements: 4.3
 */
export function getEligibleParticipants(
  participants: Participant[],
  winners: Winner[]
): Participant[] {
  const winnerParticipantIds = new Set(winners.map((w) => w.participantId));
  return participants.filter((p) => !winnerParticipantIds.has(p.id));
}

/**
 * Check if a round can be executed (sequential enforcement)
 * Round N can only be executed when all rounds 1 to N-1 are completed
 *
 * @param roundNumber - The round number to check
 * @param rounds - All lottery rounds
 * @returns true if the round can be executed, false otherwise
 *
 * Requirements: 4.6
 */
export function canExecuteRound(
  roundNumber: number,
  rounds: LotteryRound[]
): boolean {
  // Round number must be positive
  if (roundNumber < 1) {
    return false;
  }

  // For round 1, always allow if no rounds exist or round 1 is pending
  if (roundNumber === 1) {
    const round1 = rounds.find((r) => r.roundNumber === 1);
    return !round1 || round1.status === 'pending';
  }

  // For round N (N > 1), check that all rounds 1 to N-1 are completed
  for (let i = 1; i < roundNumber; i++) {
    const round = rounds.find((r) => r.roundNumber === i);
    if (!round || round.status !== 'completed') {
      return false;
    }
  }

  // Check that round N exists and is pending (not already completed)
  const targetRound = rounds.find((r) => r.roundNumber === roundNumber);
  return !targetRound || targetRound.status === 'pending';
}

/**
 * Generate export filename for winner list
 * Format: "{roundNumber}-{prizeName}-{prizeQuantity}"
 *
 * @param round - The lottery round
 * @returns Formatted filename string
 *
 * Requirements: 5.3
 */
export function generateExportFilename(round: LotteryRound): string {
  return `${round.roundNumber}-${round.prizeName}-${round.prizeQuantity}`;
}

/**
 * Validation result for lottery round
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a lottery round configuration
 * Ensures positive roundNumber, non-empty prizeName, and positive prizeQuantity
 *
 * @param round - The lottery round to validate (partial, for input validation)
 * @returns ValidationResult with valid flag and error messages
 *
 * Requirements: 3.2
 */
export function validateRound(round: {
  roundNumber?: number;
  prizeName?: string;
  prizeQuantity?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate roundNumber: must be a positive integer
  if (round.roundNumber === undefined || round.roundNumber === null) {
    errors.push('Round number is required');
  } else if (!Number.isInteger(round.roundNumber) || round.roundNumber < 1) {
    errors.push('Round number must be a positive integer');
  }

  // Validate prizeName: must be non-empty string
  if (round.prizeName === undefined || round.prizeName === null) {
    errors.push('Prize name is required');
  } else if (typeof round.prizeName !== 'string' || round.prizeName.trim() === '') {
    errors.push('Prize name must be a non-empty string');
  }

  // Validate prizeQuantity: must be a positive integer
  if (round.prizeQuantity === undefined || round.prizeQuantity === null) {
    errors.push('Prize quantity is required');
  } else if (!Number.isInteger(round.prizeQuantity) || round.prizeQuantity < 1) {
    errors.push('Prize quantity must be a positive integer');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
