import { roundRepository, activityRepository, participantRepository, winnerRepository } from '../repositories';
import type { Participant, DrawResult, WinnerWithDetails } from '../types';
import { NotFoundError, InsufficientParticipantsError, AlreadyDrawnError } from '../types/errors';

export class LotteryService {
  async executeDraw(roundId: number): Promise<DrawResult> {
    const round = await roundRepository.findById(roundId);
    if (!round) {
      throw new NotFoundError('Round', roundId);
    }

    if (round.isDrawn) {
      throw new AlreadyDrawnError(roundId);
    }

    const activity = await activityRepository.findById(round.activityId);
    if (!activity) {
      throw new NotFoundError('Activity', round.activityId);
    }

    // 获取可用参与人员
    const availableParticipants = await participantRepository.findAvailableForRound(
      round.activityId,
      activity.allowMultiWin
    );

    if (availableParticipants.length < round.winnerCount) {
      throw new InsufficientParticipantsError(round.winnerCount, availableParticipants.length);
    }

    // 随机抽取中奖者
    const winners = this.randomSelect(availableParticipants, round.winnerCount);

    // 保存中奖记录
    await winnerRepository.createMany(roundId, winners.map(w => w.id));

    // 标记轮次已抽奖
    await roundRepository.markAsDrawn(roundId);

    return {
      round: { ...round, isDrawn: true },
      winners,
      mode: round.lotteryMode,
      drawnAt: new Date(),
    };
  }

  async getDrawResult(roundId: number): Promise<WinnerWithDetails[]> {
    const round = await roundRepository.findById(roundId);
    if (!round) {
      throw new NotFoundError('Round', roundId);
    }
    return await winnerRepository.findByRoundId(roundId);
  }


  async getAvailableParticipants(activityId: number): Promise<Participant[]> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return participantRepository.findAvailableForRound(activityId, activity.allowMultiWin);
  }

  async getActivityWinners(activityId: number): Promise<WinnerWithDetails[]> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return await winnerRepository.findByActivityId(activityId);
  }

  // Fisher-Yates 洗牌算法随机选择
  private randomSelect(participants: Participant[], count: number): Participant[] {
    const shuffled = [...participants];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }
}

export const lotteryService = new LotteryService();
