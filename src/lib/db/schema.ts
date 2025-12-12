import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  // 参与人员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 抽奖活动表
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      allow_multi_win INTEGER NOT NULL DEFAULT 0,
      animation_duration_ms INTEGER NOT NULL DEFAULT 60000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 抽奖轮次表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      prize_name TEXT NOT NULL,
      prize_description TEXT,
      winner_count INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      lottery_mode TEXT NOT NULL DEFAULT 'wheel',
      is_drawn INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // 中奖记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    )
  `);

  // 活动参与人员关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_participants (
      activity_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      PRIMARY KEY (activity_id, participant_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rounds_activity_id ON rounds(activity_id);
    CREATE INDEX IF NOT EXISTS idx_winners_round_id ON winners(round_id);
    CREATE INDEX IF NOT EXISTS idx_winners_participant_id ON winners(participant_id);
    CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_participants_participant ON activity_participants(participant_id);
  `);
}
