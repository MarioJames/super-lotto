import { getDatabase } from '../db';
import type { Participant, CreateParticipantDTO, UpdateParticipantDTO, ParticipantCSVRow, ImportResult } from '../types';

interface ParticipantRow {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  email: string;
  created_at: string;
}

function rowToParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    name: row.name,
    employeeId: row.employee_id,
    department: row.department,
    email: row.email,
    createdAt: new Date(row.created_at),
  };
}

export class ParticipantRepository {
  findById(id: number): Participant | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as ParticipantRow | undefined;
    return row ? rowToParticipant(row) : null;
  }

  findAll(): Participant[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM participants ORDER BY id').all() as ParticipantRow[];
    return rows.map(rowToParticipant);
  }

  findByEmployeeId(employeeId: string): Participant | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM participants WHERE employee_id = ?').get(employeeId) as ParticipantRow | undefined;
    return row ? rowToParticipant(row) : null;
  }

  create(data: CreateParticipantDTO): Participant {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO participants (name, employee_id, department, email)
      VALUES (?, ?, ?, ?)
    `).run(data.name, data.employeeId, data.department, data.email);

    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: UpdateParticipantDTO): Participant | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.employeeId !== undefined) {
      updates.push('employee_id = ?');
      values.push(data.employeeId);
    }
    if (data.department !== undefined) {
      updates.push('department = ?');
      values.push(data.department);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE participants SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM participants WHERE id = ?').run(id);
    return result.changes > 0;
  }

  findByActivityId(activityId: number): Participant[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT p.* FROM participants p
      INNER JOIN activity_participants ap ON p.id = ap.participant_id
      WHERE ap.activity_id = ?
      ORDER BY p.id
    `).all(activityId) as ParticipantRow[];
    return rows.map(rowToParticipant);
  }

  importFromCSV(data: ParticipantCSVRow[]): ImportResult {
    const db = getDatabase();
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const insertStmt = db.prepare(`
      INSERT INTO participants (name, employee_id, department, email)
      VALUES (?, ?, ?, ?)
    `);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || !row.employeeId || !row.department || !row.email) {
          result.failed++;
          result.errors.push({ row: i + 1, message: 'Missing required fields' });
          continue;
        }

        insertStmt.run(row.name, row.employeeId, row.department, row.email);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  findAvailableForRound(activityId: number, allowMultiWin: boolean): Participant[] {
    const db = getDatabase();

    if (allowMultiWin) {
      return this.findByActivityId(activityId);
    }

    // 排除已中奖的参与人员
    const rows = db.prepare(`
      SELECT p.* FROM participants p
      INNER JOIN activity_participants ap ON p.id = ap.participant_id
      WHERE ap.activity_id = ?
      AND p.id NOT IN (
        SELECT w.participant_id FROM winners w
        INNER JOIN rounds r ON w.round_id = r.id
        WHERE r.activity_id = ?
      )
      ORDER BY p.id
    `).all(activityId, activityId) as ParticipantRow[];

    return rows.map(rowToParticipant);
  }
}

export const participantRepository = new ParticipantRepository();
