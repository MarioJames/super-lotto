import { activityRepository } from '../repositories';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO } from '../types';
import { MIN_ANIMATION_DURATION_MS, MAX_ANIMATION_DURATION_MS } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class ActivityService {
  listActivities(): Activity[] {
    return activityRepository.findAll();
  }

  getActivity(id: number): ActivityWithRounds {
    const activity = activityRepository.findWithRounds(id);
    if (!activity) {
      throw new NotFoundError('Activity', id);
    }
    return activity;
  }

  createActivity(data: CreateActivityDTO): Activity {
    this.validateActivityData(data);
    return activityRepository.create(data);
  }

  updateActivity(id: number, data: UpdateActivityDTO): Activity {
    const existing = activityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Activity', id);
    }

    if (data.animationDurationMs !== undefined) {
      this.validateAnimationDuration(data.animationDurationMs);
    }

    const updated = activityRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Activity', id);
    }
    return updated;
  }

  deleteActivity(id: number): boolean {
    const existing = activityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Activity', id);
    }
    return activityRepository.delete(id);
  }

  addParticipantsToActivity(activityId: number, participantIds: number[]): void {
    const existing = activityRepository.findById(activityId);
    if (!existing) {
      throw new NotFoundError('Activity', activityId);
    }
    activityRepository.addParticipants(activityId, participantIds);
  }

  removeParticipantsFromActivity(activityId: number, participantIds: number[]): void {
    const existing = activityRepository.findById(activityId);
    if (!existing) {
      throw new NotFoundError('Activity', activityId);
    }
    activityRepository.removeParticipants(activityId, participantIds);
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
