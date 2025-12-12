// 抽奖模式枚举
export enum LotteryMode {
  DOUBLE_BALL = 'double_ball',
  SCRATCH = 'scratch',
  ZUMA = 'zuma',
  HORSE_RACE = 'horse_race',
  WHEEL = 'wheel',
  SLOT_MACHINE = 'slot_machine'
}

// 配置常量
export const DEFAULT_ANIMATION_DURATION_MS = 60000;
export const MIN_ANIMATION_DURATION_MS = 10000;
export const MAX_ANIMATION_DURATION_MS = 300000;

// 参与人员
export interface Participant {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  email: string;
  createdAt: Date;
}

// 抽奖活动
export interface Activity {
  id: number;
  name: string;
  description: string;
  allowMultiWin: boolean;
  animationDurationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

// 活动（含轮次和参与人员）
export interface ActivityWithRounds extends Activity {
  rounds: Round[];
  participants: Participant[];
}

// 抽奖轮次
export interface Round {
  id: number;
  activityId: number;
  prizeName: string;
  prizeDescription: string;
  winnerCount: number;
  orderIndex: number;
  lotteryMode: LotteryMode;
  isDrawn: boolean;
  createdAt: Date;
}

// 中奖记录
export interface Winner {
  id: number;
  roundId: number;
  participantId: number;
  drawnAt: Date;
}

// 中奖记录（含详情）
export interface WinnerWithDetails extends Winner {
  participant: Participant;
  round: Round;
}

// CSV 导入行
export interface ParticipantCSVRow {
  name: string;
  employeeId: string;
  department: string;
  email: string;
}

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// 抽奖结果
export interface DrawResult {
  round: Round;
  winners: Participant[];
  mode: LotteryMode;
  drawnAt: Date;
}

// DTO 类型
export interface CreateParticipantDTO {
  name: string;
  employeeId: string;
  department: string;
  email: string;
}

export interface UpdateParticipantDTO {
  name?: string;
  employeeId?: string;
  department?: string;
  email?: string;
}

export interface CreateActivityDTO {
  name: string;
  description: string;
  allowMultiWin: boolean;
  animationDurationMs?: number;
  participantIds: number[];
}

export interface UpdateActivityDTO {
  name?: string;
  description?: string;
  allowMultiWin?: boolean;
  animationDurationMs?: number;
}

export interface CreateRoundDTO {
  prizeName: string;
  prizeDescription: string;
  winnerCount: number;
  lotteryMode: LotteryMode;
}

export interface UpdateRoundDTO {
  prizeName?: string;
  prizeDescription?: string;
  winnerCount?: number;
  orderIndex?: number;
  lotteryMode?: LotteryMode;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
