import { getDatabase } from '../db';
import type { Round, CreateRoundDTO, UpdateRoundDTO, LotteryMode } from '../types';

interface RoundRow {
  id: number;
  activity_id: number;
  prize_name: string;
  prize_description: string;
  winner_count: number;
  order_index: number;
  lottery_mode: string;
  is_drawn: number;
  created_at: string;
}

function rowToRound(row: RoundRow): Round {
  return {
    id: row.id,
    activityId: row.activity_id,
    prizeName: row.prize_name,
    prizeDescription: row.prize_description || '',
    winnerCount: row.winner_count,
    orderIndex: row.order_index,
    lotteryMode: row.lottery_mode as LotteryMode,
    isDrawn: row.is_drawn === 1,
    createdAt: new Date(row.created_at),
  };
}

export class RoundRepository {
  findById(id: number): Round | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM rounds WHERE id = ?').get(id) as RoundRow | undefined;
    return row ? rowToRound(row) : null;
  }

  findByActivityId(activityId: number): Round[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM rounds WHERE activity_id = ? ORDER BY order_index ASC
    `).all(activityId) as RoundRow[];
    return rows.map(rowToRound);
  }

  create(activityId: number, data: CreateRoundDTO): Round {
    const db = getDatabase();

    // 获取当前最大 order_index
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) as max_order FROM rounds WHERE activity_id = ?
    `).get(activityId) as { max_order: number };

    const orderIndex = maxOrder.max_order + 1;

    const result = db.prepare(`
      INSERT INTO rounds (activity_id, prize_name, prize_description, winner_count, order_index, lottery_mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(activityId, data.prizeName, data.prizeDescription, data.winnerCount, orderIndex, data.lotteryMode);

    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: UpdateRoundDTO): Round | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.prizeName !== undefined) {
      updates.push('prize_name = ?');
      values.push(data.prizeName);
    }
    if (data.prizeDescription !== undefined) {
      updates.push('prize_description = ?');
      values.push(data.prizeDescription);
    }
    if (data.winnerCount !== undefined) {
      updates.push('winner_count = ?');
      values.push(data.winnerCount);
    }
    if (data.orderIndex !== undefined) {
      updates.push('order_index = ?');
      values.push(data.orderIndex);
    }
    if (data.lotteryMode !== undefined) {
      updates.push('lottery_mode = ?');
      values.push(data.lotteryMode);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE rounds SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM rounds WHERE id = ?').run(id);
    return result.changes > 0;
  }

  markAsDrawn(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE rounds SET is_drawn = 1 WHERE id = ?').run(id);
    return result.changes > 0;
  }

  updateOrder(activityId: number, roundIds: number[]): void {
    const db = getDatabase();
    const updateStmt = db.prepare('UPDATE rounds SET order_index = ? WHERE id = ? AND activity_id = ?');

    for (let i = 0; i < roundIds.length; i++) {
      updateStmt.run(i, roundIds[i], activityId);
    }
  }
}

export const roundRepository = new RoundRepository();
