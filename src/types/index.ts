// Core data types for the Lottery Agent system

/**
 * Participant - 参与抽奖的人员
 */
export interface Participant {
  id: string;
  name: string;
  department?: string;
  metadata?: Record<string, string>;
}

/**
 * LotteryRound - 抽奖轮次
 */
export interface LotteryRound {
  id: string;
  roundNumber: number;
  prizeName: string;
  prizeQuantity: number;
  status: 'pending' | 'completed';
  createdAt: number;
}

/**
 * Winner - 中奖者
 */
export interface Winner {
  id: string;
  participantId: string;
  participantName: string;
  roundId: string;
  prizeName: string;
  wonAt: number;
}

/**
 * LotteryState - 本地存储数据结构
 */
export interface LotteryState {
  participants: Participant[];
  rounds: LotteryRound[];
  winners: Winner[];
  currentRoundIndex: number;
}

/**
 * Message - 聊天消息
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
  createdAt: Date;
}


/**
 * ToolInvocation - 工具调用
 */
export interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

// Card Types

/**
 * CardType - 卡片类型枚举
 */
export type CardType =
  | 'welcome'
  | 'participant-list'
  | 'round-config'
  | 'winner-result'
  | 'error';

/**
 * CardData - 统一卡片数据结构
 */
export interface CardData<T extends CardType = CardType> {
  type: T;
  id: string;
  timestamp: number;
  data: CardPayloadMap[T];
}

/**
 * CardPayloadMap - 各卡片类型的数据载荷映射
 */
export interface CardPayloadMap {
  'welcome': WelcomePayload;
  'participant-list': ParticipantListPayload;
  'round-config': RoundConfigPayload;
  'winner-result': WinnerResultPayload;
  'error': ErrorPayload;
}

/**
 * WelcomePayload - 欢迎卡片数据
 */
export interface WelcomePayload {
  title: string;
  message: string;
  actions: Array<{
    id: string;
    label: string;
    action: 'howToUse' | 'uploadCsv' | 'configRound';
  }>;
}

/**
 * ParticipantListPayload - 参与人员列表卡片数据
 */
export interface ParticipantListPayload {
  participants: Participant[];
  summary: string;
  totalCount: number;
  needsConfirmation: boolean;
}

/**
 * RoundConfigPayload - 轮次配置卡片数据
 */
export interface RoundConfigPayload {
  round: LotteryRound;
  description: string;
  needsConfirmation: boolean;
}

/**
 * WinnerResultPayload - 中奖结果卡片数据
 */
export interface WinnerResultPayload {
  round: LotteryRound;
  winners: Winner[];
  remainingParticipants: number;
  canExport: boolean;
}

/**
 * ErrorPayload - 错误卡片数据
 */
export interface ErrorPayload {
  title: string;
  message: string;
  retryable: boolean;
}

/**
 * CardAction - 卡片动作类型
 */
export type CardAction =
  | { type: 'confirm-participants' }
  | { type: 'cancel-participants' }
  | { type: 'confirm-round' }
  | { type: 'edit-round' }
  | { type: 'export-winners'; roundId: string }
  | { type: 'how-to-use' }
  | { type: 'retry' };

// Storage Keys
export const STORAGE_KEYS = {
  LOTTERY_STATE: 'lottery-agent-state',
  CHAT_MESSAGES: 'lottery-agent-messages',
} as const;
