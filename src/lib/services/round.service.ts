import { roundRepository, activityRepository } from '../repositories';
import type { Round, CreateRoundDTO, UpdateRoundDTO } from '../types';
import { MIN_ANIMATION_DURATION_MS, MAX_ANIMATION_DURATION_MS } from '../types';
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

  /**
   * 添加轮次
   * Requirements: 6.1
   */
  async addRound(activityId: number, data: CreateRoundDTO): Promise<Round> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }

    this.validateRoundData(data);
    return roundRepository.create(activityId, data);
  }

  /**
   * 更新轮次
   * Requirements: 6.2
   */
  async updateRound(id: number, data: UpdateRoundDTO): Promise<Round> {
    const existing = await roundRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Round', id);
    }

    if (data.winnerCount !== undefined && data.winnerCount < 1) {
      throw new ValidationError('中奖人数必须至少为1');
    }

    // 验证动画时长 - Requirements 6.2
    if (data.animationDurationMs !== undefined) {
      this.validateAnimationDuration(data.animationDurationMs);
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
      throw new ValidationError('奖品名称不能为空');
    }
    if (data.winnerCount < 1) {
      throw new ValidationError('中奖人数必须至少为1');
    }
    // 验证动画时长（如果提供）- Requirements 6.1
    if (data.animationDurationMs !== undefined) {
      this.validateAnimationDuration(data.animationDurationMs);
    }
  }

  /**
   * 验证动画时长范围（10-300秒）
   */
  private validateAnimationDuration(duration: number): void {
    if (duration < MIN_ANIMATION_DURATION_MS || duration > MAX_ANIMATION_DURATION_MS) {
      throw new ValidationError(
        `动画时长必须在 ${MIN_ANIMATION_DURATION_MS / 1000} 秒到 ${MAX_ANIMATION_DURATION_MS / 1000} 秒之间`,
        { min: MIN_ANIMATION_DURATION_MS, max: MAX_ANIMATION_DURATION_MS, provided: duration }
      );
    }
  }
}

export const roundService = new RoundService();
