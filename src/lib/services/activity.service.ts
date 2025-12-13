import { activityRepository } from '../repositories';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO } from '../types';
import { MIN_ANIMATION_DURATION_MS, MAX_ANIMATION_DURATION_MS } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class ActivityService {
  async listActivities(): Promise<Activity[]> {
    return activityRepository.findAll();
  }

  async getActivity(id: number): Promise<ActivityWithRounds> {
    const activity = await activityRepository.findWithRounds(id);
    if (!activity) {
      throw new NotFoundError('Activity', id);
    }
    return activity;
  }

  async createActivity(data: CreateActivityDTO): Promise<Activity> {
    this.validateActivityData(data);
    return activityRepository.create(data);
  }

  async updateActivity(id: number, data: UpdateActivityDTO): Promise<Activity> {
    const existing = await activityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Activity', id);
    }

    if (data.animationDurationMs !== undefined) {
      this.validateAnimationDuration(data.animationDurationMs);
    }

    const updated = await activityRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Activity', id);
    }
    return updated;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const existing = await activityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Activity', id);
    }
    return activityRepository.delete(id);
  }

  async addParticipantsToActivity(activityId: number, participantIds: number[]): Promise<void> {
    const existing = await activityRepository.findById(activityId);
    if (!existing) {
      throw new NotFoundError('Activity', activityId);
    }
    await activityRepository.addParticipants(activityId, participantIds);
  }

  async removeParticipantsFromActivity(activityId: number, participantIds: number[]): Promise<void> {
    const existing = await activityRepository.findById(activityId);
    if (!existing) {
      throw new NotFoundError('Activity', activityId);
    }
    await activityRepository.removeParticipants(activityId, participantIds);
  }

  private validateActivityData(data: CreateActivityDTO): void {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Activity name is required');
    }
    if (data.animationDurationMs !== undefined) {
      this.validateAnimationDuration(data.animationDurationMs);
    }
  }

  private validateAnimationDuration(duration: number): void {
    if (duration < MIN_ANIMATION_DURATION_MS || duration > MAX_ANIMATION_DURATION_MS) {
      throw new ValidationError(
        `Animation duration must be between ${MIN_ANIMATION_DURATION_MS}ms and ${MAX_ANIMATION_DURATION_MS}ms`,
        { min: MIN_ANIMATION_DURATION_MS, max: MAX_ANIMATION_DURATION_MS, provided: duration }
      );
    }
  }
}

export const activityService = new ActivityService();
