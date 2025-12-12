import { getDatabase } from '../db';
import type { Winner, WinnerWithDetails, Participant, Round, LotteryMode } from '../types';

interface WinnerRow {
  id: number;
  round_id: number;
  participant_id: number;
  drawn_at: string;
}

interface WinnerWithDetailsRow extends WinnerRow {
  participant_name: string;
  participant_employee_id: string;
  participant_department: string;
  participant_email: string;
  participant_created_at: string;
  round_activity_id: number;
  round_prize_name: string;
  round_prize_description: string;
  round_winner_count: number;
  round_order_index: number;
  round_lottery_mode: string;
  round_is_drawn: number;
  round_created_at: string;
}

function rowToWinner(row: WinnerRow): Winner {
  return {
    id: row.id,
    roundId: row.round_id,
    participantId: row.participant_id,
    drawnAt: new Date(row.drawn_at),
  };
}

function rowToWinnerWithDetails(row: WinnerWithDetailsRow): WinnerWithDetails {
  const participant: Participant = {
    id: row.participant_id,
    name: row.participant_name,
    employeeId: row.participant_employee_id,
    department: row.participant_department,
    email: row.participant_email,
    createdAt: new Date(row.participant_created_at),
  };

  const round: Round = {
    id: row.round_id,
    activityId: row.round_activity_id,
    prizeName: row.round_prize_name,
    prizeDescription: row.round_prize_description || '',
    winnerCount: row.round_winner_count,
    orderIndex: row.round_order_index,
    lotteryMode: row.round_lottery_mode as LotteryMode,
    isDrawn: row.round_is_drawn === 1,
    createdAt: new Date(row.round_created_at),
  };

  return {
    id: row.id,
    roundId: row.round_id,
    participantId: row.participant_id,
    drawnAt: new Date(row.drawn_at),
    participant,
    round,
  };
}

export class WinnerRepository {
  create(roundId: number, participantId: number): Winner {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO winners (round_id, participant_id) VALUES (?, ?)
    `).run(roundId, participantId);

    const row = db.prepare('SELECT * FROM winners WHERE id = ?').get(result.lastInsertRowid) as WinnerRow;
    return rowToWinner(row);
  }

  createMany(roundId: number, participantIds: number[]): Winner[] {
    const db = getDatabase();
    const insertStmt = db.prepare(`
      INSERT INTO winners (round_id, participant_id) VALUES (?, ?)
    `);

    const winners: Winner[] = [];
    for (const participantId of participantIds) {
      const result = insertStmt.run(roundId, participantId);
      const row = db.prepare('SELECT * FROM winners WHERE id = ?').get(result.lastInsertRowid) as WinnerRow;
      winners.push(rowToWinner(row));
    }

    return winners;
  }

  findByRoundId(roundId: number): WinnerWithDetails[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        w.*,
        p.name as participant_name,
        p.employee_id as participant_employee_id,
        p.department as participant_department,
        p.email as participant_email,
        p.created_at as participant_created_at,
        r.activity_id as round_activity_id,
        r.prize_name as round_prize_name,
        r.prize_description as round_prize_description,
        r.winner_count as round_winner_count,
        r.order_index as round_order_index,
        r.lottery_mode as round_lottery_mode,
        r.is_drawn as round_is_drawn,
        r.created_at as round_created_at
      FROM winners w
      INNER JOIN participants p ON w.participant_id = p.id
      INNER JOIN rounds r ON w.round_id = r.id
      WHERE w.round_id = ?
      ORDER BY w.id
    `).all(roundId) as WinnerWithDetailsRow[];

    return rows.map(rowToWinnerWithDetails);
  }

  findByActivityId(activityId: number): WinnerWithDetails[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        w.*,
        p.name as participant_name,
        p.employee_id as participant_employee_id,
        p.department as participant_department,
        p.email as participant_email,
        p.created_at as participant_created_at,
        r.activity_id as round_activity_id,
        r.prize_name as round_prize_name,
        r.prize_description as round_prize_description,
        r.winner_count as round_winner_count,
        r.order_index as round_order_index,
        r.lottery_mode as round_lottery_mode,
        r.is_drawn as round_is_drawn,
        r.created_at as round_created_at
      FROM winners w
      INNER JOIN participants p ON w.participant_id = p.id
      INNER JOIN rounds r ON w.round_id = r.id
      WHERE r.activity_id = ?
      ORDER BY r.order_index, w.id
    `).all(activityId) as WinnerWithDetailsRow[];

    return rows.map(rowToWinnerWithDetails);
  }

  findByParticipantId(participantId: number): Winner[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM winners WHERE participant_id = ? ORDER BY id
    `).all(participantId) as WinnerRow[];

    return rows.map(rowToWinner);
  }

  deleteByRoundId(roundId: number): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM winners WHERE round_id = ?').run(roundId);
    return result.changes;
  }
}

export const winnerRepository = new WinnerRepository();
