import { roundRepository, activityRepository } from '../repositories';
import type { Round, CreateRoundDTO, UpdateRoundDTO } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class RoundService {
  async getRounds(activityId: number): Promise<Round[]> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return roundRepository.findByActivityId(activityId);
  }

  async getRound(id: number): Promise<Round> {
    const round = await roundRepository.findById(id);
    if (!round) {
      throw new NotFoundError('Round', id);
    }
    return round;
  }

  async addRound(activityId: number, data: CreateRoundDTO): Promise<Round> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }

    this.validateRoundData(data);
    return roundRepository.create(activityId, data);
  }

  async updateRound(id: number, data: UpdateRoundDTO): Promise<Round> {
    const existing = await roundRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Round', id);
    }

    if (data.winnerCount !== undefined && data.winnerCount < 1) {
      throw new ValidationError('Winner count must be at least 1');
    }

    const updated = await roundRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Round', id);
    }
    return updated;
  }

  async deleteRound(id: number): Promise<boolean> {
    const existing = await roundRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Round', id);
    }
    return roundRepository.delete(id);
  }

  async reorderRounds(activityId: number, roundIds: number[]): Promise<void> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    await roundRepository.updateOrder(activityId, roundIds);
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
