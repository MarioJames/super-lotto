/**
 * Card Mapper - Maps AI Tool results to CardData
 * Converts tool invocation results to renderable card data
 *
 * Requirements: 3.2, 4.4
 */

import {
  CardData,
  Participant,
  LotteryRound,
  Winner,
} from '@/types';

/**
 * Generate a unique ID for cards
 */
function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * ParseParticipants tool result type
 */
interface ParseParticipantsResult {
  participants: Participant[];
  summary: string;
}

/**
 * ConfigureRound tool result type
 */
interface ConfigureRoundResult {
  roundNumber: number;
  prizeName: string;
  prizeQuantity: number;
  description?: string;
}

/**
 * ExecuteLottery tool result type
 */
interface ExecuteLotteryResult {
  round: LotteryRound;
  winners: Winner[];
  remainingCount: number;
}

/**
 * Map parseParticipants tool result to participant-list card
 */
export function mapParseParticipantsToCard(
  result: ParseParticipantsResult
): CardData<'participant-list'> {
  return {
    type: 'participant-list',
    id: generateId(),
    timestamp: Date.now(),
    data: {
      participants: result.participants,
      summary: result.summary,
      totalCount: result.participants.length,
      needsConfirmation: true,
    },
  };
}

/**
 * Map configureRound tool result to round-config card
 */
export function mapConfigureRoundToCard(
  result: ConfigureRoundResult
): CardData<'round-config'> {
  return {
    type: 'round-config',
    id: generateId(),
    timestamp: Date.now(),
    data: {
      round: {
        id: generateId(),
        roundNumber: result.roundNumber,
        prizeName: result.prizeName,
        prizeQuantity: result.prizeQuantity,
        status: 'pending',
        createdAt: Date.now(),
      },
      description: result.description || '',
      needsConfirmation: true,
    },
  };
}

/**
 * Map executeLottery tool result to winner-result card
 */
export function mapExecuteLotteryToCard(
  result: ExecuteLotteryResult
): CardData<'winner-result'> {
  return {
    type: 'winner-result',
    id: generateId(),
    timestamp: Date.now(),
    data: {
      round: result.round,
      winners: result.winners,
      remainingParticipants: result.remainingCount,
      canExport: true,
    },
  };
}

/**
 * Map any tool result to appropriate card data
 * Returns null if tool name is not recognized
 */
export function mapToolResultToCard(
  toolName: string,
  result: unknown
): CardData | null {
  switch (toolName) {
    case 'parseParticipants':
      return mapParseParticipantsToCard(result as ParseParticipantsResult);
    case 'configureRound':
      return mapConfigureRoundToCard(result as ConfigureRoundResult);
    case 'executeLottery':
      return mapExecuteLotteryToCard(result as ExecuteLotteryResult);
    default:
      return null;
  }
}

/**
 * Create a welcome card with default content
 */
export function createWelcomeCard(): CardData<'welcome'> {
  return {
    type: 'welcome',
    id: generateId(),
    timestamp: Date.now(),
    data: {
      title: '欢迎使用抽奖助手',
      message: '我是您的抽奖智能助手，可以帮助您完成参与人员导入、抽奖轮次配置和抽奖执行。',
      actions: [
        { id: 'how-to-use', label: '使用说明', action: 'howToUse' },
        { id: 'upload-csv', label: '上传参与人员', action: 'uploadCsv' },
        { id: 'config-round', label: '配置抽奖轮次', action: 'configRound' },
      ],
    },
  };
}

/**
 * Create an error card
 */
export function createErrorCard(
  title: string,
  message: string,
  retryable: boolean = false
): CardData<'error'> {
  return {
    type: 'error',
    id: generateId(),
    timestamp: Date.now(),
    data: {
      title,
      message,
      retryable,
    },
  };
}
