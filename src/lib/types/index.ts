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
  activityId: number;  // 新增：关联到活动
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
  // 移除 animationDurationMs - 已移至 Round 类型
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
  animationDurationMs: number;  // 新增：动画时长
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

// CSV 导入行 - 仅姓名必填
export interface ParticipantCSVRow {
  name: string;           // 必填
  employeeId?: string;    // 可选
  department?: string;    // 可选
  email?: string;         // 可选
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
  // 移除 animationDurationMs - 已移至轮次配置
  // 移除 participantIds - 改为直接传入人员数据
  participants: ParticipantCSVRow[];  // 新增：直接传入人员数据
}

export interface UpdateActivityDTO {
  name?: string;
  description?: string;
  allowMultiWin?: boolean;
  // 移除 animationDurationMs - 已移至轮次配置
}

export interface CreateRoundDTO {
  prizeName: string;
  prizeDescription: string;
  winnerCount: number;
  lotteryMode: LotteryMode;
  animationDurationMs?: number;  // 新增：默认 60000
}

export interface UpdateRoundDTO {
  prizeName?: string;
  prizeDescription?: string;
  winnerCount?: number;
  orderIndex?: number;
  lotteryMode?: LotteryMode;
  animationDurationMs?: number;  // 新增
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
