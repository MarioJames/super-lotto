import { getDatabase } from '../db';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO } from '../types';
import { participantRepository } from './participant.repository';
import { roundRepository } from './round.repository';
import { DEFAULT_ANIMATION_DURATION_MS } from '../types';

interface ActivityRow {
  id: number;
  name: string;
  description: string;
  allow_multi_win: number;
  animation_duration_ms: number;
  created_at: string;
  updated_at: string;
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    allowMultiWin: row.allow_multi_win === 1,
    animationDurationMs: row.animation_duration_ms,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ActivityRepository {
  findById(id: number): Activity | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    return row ? rowToActivity(row) : null;
  }

  findAll(): Activity[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM activities ORDER BY id DESC').all() as ActivityRow[];
    return rows.map(rowToActivity);
  }

  findWithRounds(id: number): ActivityWithRounds | null {
    const activity = this.findById(id);
    if (!activity) return null;

    const rounds = roundRepository.findByActivityId(id);
    const participants = participantRepository.findByActivityId(id);

    return {
      ...activity,
      rounds,
      participants,
    };
  }

  create(data: CreateActivityDTO): Activity {
    const db = getDatabase();
    const animationDuration = data.animationDurationMs ?? DEFAULT_ANIMATION_DURATION_MS;

    const result = db.prepare(`
      INSERT INTO activities (name, description, allow_multi_win, animation_duration_ms)
      VALUES (?, ?, ?, ?)
    `).run(data.name, data.description, data.allowMultiWin ? 1 : 0, animationDuration);

    const activityId = result.lastInsertRowid as number;

    // 关联参与人员
    if (data.participantIds.length > 0) {
      const insertParticipant = db.prepare(`
        INSERT INTO activity_participants (activity_id, participant_id) VALUES (?, ?)
      `);
      for (const participantId of data.participantIds) {
        insertParticipant.run(activityId, participantId);
      }
    }

    return this.findById(activityId)!;
  }

  update(id: number, data: UpdateActivityDTO): Activity | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.allowMultiWin !== undefined) {
      updates.push('allow_multi_win = ?');
      values.push(data.allowMultiWin ? 1 : 0);
    }
    if (data.animationDurationMs !== undefined) {
      updates.push('animation_duration_ms = ?');
      values.push(data.animationDurationMs);
    }

    values.push(id);
    db.prepare(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDatabase();
    // 级联删除由外键约束处理
    const result = db.prepare('DELETE FROM activities WHERE id = ?').run(id);
    return result.changes > 0;
  }

  addParticipants(activityId: number, participantIds: number[]): void {
    const db = getDatabase();
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO activity_participants (activity_id, participant_id) VALUES (?, ?)
    `);
    for (const participantId of participantIds) {
      insertStmt.run(activityId, participantId);
    }
  }

  removeParticipants(activityId: number, participantIds: number[]): void {
    const db = getDatabase();
    const deleteStmt = db.prepare(`
      DELETE FROM activity_participants WHERE activity_id = ? AND participant_id = ?
    `);
    for (const participantId of participantIds) {
      deleteStmt.run(activityId, participantId);
    }
  }
}

export const activityRepository = new ActivityRepository();
