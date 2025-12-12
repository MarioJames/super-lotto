import { stringify } from 'csv-stringify/sync';
import { activityRepository, winnerRepository } from '../repositories';
import { NotFoundError } from '../types/errors';

interface ExportRow {
  活动名称: string;
  轮次: string;
  奖品名称: string;
  奖品描述: string;
  中奖人姓名: string;
  工号: string;
  部门: string;
  邮箱: string;
  中奖时间: string;
}

export class ExportService {
  exportActivityWinners(activityId: number): string {
    const activity = activityRepository.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity', activityId);
    }

    const winners = winnerRepository.findByActivityId(activityId);

    const rows: ExportRow[] = winners.map(winner => ({
      活动名称: activity.name,
      轮次: `第${winner.round.orderIndex + 1}轮`,
      奖品名称: winner.round.prizeName,
      奖品描述: winner.round.prizeDescription,
      中奖人姓名: winner.participant.name,
      工号: winner.participant.employeeId,
      部门: winner.participant.department,
      邮箱: winner.participant.email,
      中奖时间: winner.drawnAt.toLocaleString('zh-CN'),
    }));

    return stringify(rows, { header: true });
  }

  exportRoundWinners(roundId: number): string {
    const winners = winnerRepository.findByRoundId(roundId);

    if (winners.length === 0) {
      return stringify([], { header: true, columns: ['中奖人姓名', '工号', '部门', '邮箱', '中奖时间'] });
    }

    const activity = activityRepository.findById(winners[0].round.activityId);

    const rows: ExportRow[] = winners.map(winner => ({
      活动名称: activity?.name || '',
      轮次: `第${winner.round.orderIndex + 1}轮`,
      奖品名称: winner.round.prizeName,
      奖品描述: winner.round.prizeDescription,
      中奖人姓名: winner.participant.name,
      工号: winner.participant.employeeId,
      部门: winner.participant.department,
      邮箱: winner.participant.email,
      中奖时间: winner.drawnAt.toLocaleString('zh-CN'),
    }));

    return stringify(rows, { header: true });
  }
}

export const exportService = new ExportService();
