import { roundRepository, activityRepository, participantRepository, winnerRepository } from '../repositories';
import type { Participant, Round, DrawResult, WinnerWithDetails } from '../types';
import { NotFoundError, InsufficientParticipantsError, AlreadyDrawnError } from '../types/errors';

export class LotteryService {
  executeDraw(roundId: number): DrawResult {
    const round = roundRepository.findById(roundId);
    if (!round) {
      throw new NotFoundError('Round', roundId);
    }

    if (round.isDrawn) {
      throw new AlreadyDrawnError(roundId);
    }

    const activity = activityRepository.findById(round.activityId);
    if (!activity) {
      throw new NotFoundError('Activity', round.activityId);
    }

    // 获取可用参与人员
    const availableParticipants = participantRepository.findAvailableForRound(
      round.activityId,
      activity.allowMultiWin
    );

    if (availableParticipants.length < round.winnerCount) {
      throw new InsufficientParticipantsError(round.winnerCount, availableParticipants.length);
    }

    // 随机抽取中奖者
    const winners = this.randomSelect(availableParticipants, round.winnerCount);

    // 保存中奖记录
    winnerRepository.createMany(roundId, winners.map(w => w.id));

    // 标记轮次已抽奖
    roundRepository.markAsDrawn(roundId);

    return {
      round: { ...round, isDrawn: true },
      winners,
      mode: round.lotteryMode,
      drawnAt: new Date(),
    };
  }

  getDrawResult(roundId: number): WinnerWithDetails[] {
    const round = roundRepository.findById(roundId);
    if (!round) {
      throw new NotFoundError('Round', roundId);
    }
    return winnerRepository.findByRoundId(roundId);
  }

  getAvailableParticipants(activityId: number): Participant[] {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return participantRepository.findAvailableForRound(activityId, activity.allowMultiWin);
  }

  getActivityWinners(activityId: number): WinnerWithDetails[] {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }
    return winnerRepository.findByActivityId(activityId);
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
