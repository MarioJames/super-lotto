import { activityRepository, participantRepository } from '../repositories';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO } from '../types';
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

  /**
   * 创建活动并直接创建参与人员
   * Requirements: 1.6, 1.7
   */
  async createActivity(data: CreateActivityDTO): Promise<Activity> {
    this.validateActivityData(data);

    // 验证参与人员数量 - Requirements 1.7
    const validParticipants = (data.participants || []).filter(
      p => p.name && p.name.trim() !== ''
    );

    if (validParticipants.length === 0) {
      throw new ValidationError('请至少导入一名参与人员');
    }

    return activityRepository.create(data);
  }

  async updateActivity(id: number, data: UpdateActivityDTO): Promise<Activity> {
    const existing = await activityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Activity', id);
    }

    if (data.name !== undefined) {
      this.validateActivityName(data.name);
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

  /**
   * 获取活动的参与人员数量
   */
  async getParticipantCount(activityId: number): Promise<number> {
    const existing = await activityRepository.findById(activityId);
    if (!existing) {
      throw new NotFoundError('Activity', activityId);
    }
    return participantRepository.countByActivityId(activityId);
  }

  private validateActivityData(data: CreateActivityDTO): void {
    this.validateActivityName(data.name);
  }

  private validateActivityName(name: string): void {
    if (!name || name.trim() === '') {
      throw new ValidationError('活动名称不能为空');
    }
  }
}

export const activityService = new ActivityService();
