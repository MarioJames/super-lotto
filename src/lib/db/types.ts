/**
 * Supabase 数据库类型定义
 * 对应 PostgreSQL 表结构
 */

// ============ Participants 表 ============
export interface ParticipantRow {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  email: string;
  created_at: string;
}

export interface ParticipantInsert {
  name: string;
  employee_id: string;
  department: string;
  email: string;
  created_at?: string;
}

export interface ParticipantUpdate {
  name?: string;
  employee_id?: string;
  department?: string;
  email?: string;
}

// ============ Activities 表 ============
export interface ActivityRow {
  id: number;
  name: string;
  description: string | null;
  allow_multi_win: boolean;
  animation_duration_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityInsert {
  name: string;
  description?: string | null;
  allow_multi_win?: boolean;
  animation_duration_ms?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityUpdate {
  name?: string;
  description?: string | null;
  allow_multi_win?: boolean;
  animation_duration_ms?: number;
  updated_at?: string;
}


// ============ Rounds 表 ============
export interface RoundRow {
  id: number;
  activity_id: number;
  prize_name: string;
  prize_description: string | null;
  winner_count: number;
  order_index: number;
  lottery_mode: string;
  is_drawn: boolean;
  created_at: string;
}

export interface RoundInsert {
  activity_id: number;
  prize_name: string;
  prize_description?: string | null;
  winner_count?: number;
  order_index?: number;
  lottery_mode?: string;
  is_drawn?: boolean;
  created_at?: string;
}

export interface RoundUpdate {
  prize_name?: string;
  prize_description?: string | null;
  winner_count?: number;
  order_index?: number;
  lottery_mode?: string;
  is_drawn?: boolean;
}

// ============ Winners 表 ============
export interface WinnerRow {
  id: number;
  round_id: number;
  participant_id: number;
  drawn_at: string;
}

export interface WinnerInsert {
  round_id: number;
  participant_id: number;
  drawn_at?: string;
}

export interface WinnerUpdate {
  round_id?: number;
  participant_id?: number;
  drawn_at?: string;
}

// ============ Activity Participants 关联表 ============
export interface ActivityParticipantRow {
  activity_id: number;
  participant_id: number;
}

export interface ActivityParticipantInsert {
  activity_id: number;
  participant_id: number;
}

// ============ Database 类型定义 ============
export type Database = {
  public: {
    Tables: {
      participants: {
        Row: ParticipantRow;
        Insert: ParticipantInsert;
        Update: ParticipantUpdate;
        Relationships: [];
      };
      activities: {
        Row: ActivityRow;
        Insert: ActivityInsert;
        Update: ActivityUpdate;
        Relationships: [];
      };
      rounds: {
        Row: RoundRow;
        Insert: RoundInsert;
        Update: RoundUpdate;
        Relationships: [
          {
            foreignKeyName: "rounds_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          }
        ];
      };
      winners: {
        Row: WinnerRow;
        Insert: WinnerInsert;
        Update: WinnerUpdate;
        Relationships: [
          {
            foreignKeyName: "winners_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "winners_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_participants: {
        Row: ActivityParticipantRow;
        Insert: ActivityParticipantInsert;
        Update: ActivityParticipantInsert;
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_participants_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
