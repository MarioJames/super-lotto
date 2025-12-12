import { roundRepository, activityRepository } from '../repositories';
import type { Round, CreateRoundDTO, UpdateRoundDTO } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class RoundService {
  getRounds(activityId: number): Round[] {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return roundRepository.findByActivityId(activityId);
  }

  getRound(id: number): Round {
    const round = roundRepository.findById(id);
    if (!round) {
      throw new NotFoundError('Round', id);
    }
    return round;
  }

  addRound(activityId: number, data: CreateRoundDTO): Round {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }

    this.validateRoundData(data);
    return roundRepository.create(activityId, data);
  }

  updateRound(id: number, data: UpdateRoundDTO): Round {
    const existing = roundRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Round', id);
    }

    if (data.winnerCount !== undefined && data.winnerCount < 1) {
      throw new ValidationError('Winner count must be at least 1');
    }

    const updated = roundRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Round', id);
    }
    return updated;
  }

  deleteRound(id: number): boolean {
    const existing = roundRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Round', id);
    }
    return roundRepository.delete(id);
  }

  reorderRounds(activityId: number, roundIds: number[]): void {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    roundRepository.updateOrder(activityId, roundIds);
  }

  private validateRoundData(data: CreateRoundDTO): void {
    if (!data.prizeName || data.prizeName.trim() === '') {
      throw new ValidationError('Prize name is required');
    }
    if (data.winnerCount < 1) {
      throw new ValidationError('Winner count must be at least 1');
    }
  }
}

export const roundService = new RoundService();
