/**
 * Chat API Route
 * Handles chat messages with streaming responses and AI tools
 *
 * Requirements: 2.2, 3.1, 4.1, 4.2, 6.1
 */

import { streamText, tool, zodSchema } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Participant, LotteryRound, Winner } from '@/types';
import { getEligibleParticipants, canExecuteRound, validateRound } from '@/lib/lottery';
import { AIProviderId, DEFAULT_CHAT_MODEL, DEFAULT_CHAT_PROVIDER } from '@/constants/ai';

/**
 * System prompt for the lottery agent
 */
const SYSTEM_PROMPT = `你是一个专业的抽奖助手，帮助用户完成抽奖活动。你的职责包括：

1. **参与人员管理**：帮助用户导入和确认参与抽奖的人员名单
2. **轮次配置**：根据用户的自然语言输入，提取并配置抽奖轮次信息（轮次序号、奖品名称、奖品数量）
3. **执行抽奖**：按顺序执行抽奖，确保公平随机地选出中奖者

## 重要规则：
- 抽奖必须按轮次顺序执行，不能跳过轮次
- 已中奖的参与者不能再次参与后续轮次
- 每次执行抽奖时，你会收到当前可参与抽奖的人员名单，请从中随机选择中奖者
- 使用友好、专业的语气与用户交流
- 当用户想要配置轮次时，使用 configureRound 工具
- 当用户想要执行抽奖时，使用 executeLottery 工具
- 当用户上传参与人员后，使用 parseParticipants 工具来确认数据

## 响应格式：
- 使用简洁清晰的中文回复
- 在执行操作前，简要说明即将进行的操作
- 操作完成后，提供清晰的结果摘要`;

/**
 * Request body type
 */
interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  participants?: Participant[];
  rounds?: LotteryRound[];
  winners?: Winner[];
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, participants = [], rounds = [], winners = [] } = body;

    // Calculate eligible participants (exclude previous winners)
    const eligibleParticipants = getEligibleParticipants(participants, winners);

    // Build context message with current state
    const contextMessage = buildContextMessage(participants, rounds, winners, eligibleParticipants);

    const result = streamText({
      model: createChatModel(DEFAULT_CHAT_PROVIDER, DEFAULT_CHAT_MODEL),
      system: SYSTEM_PROMPT + '\n\n' + contextMessage,
      messages,
      tools: {
        parseParticipants: tool({
          description: '解析并确认参与人员数据。当用户上传CSV文件或提供参与人员信息后使用此工具。',
          inputSchema: zodSchema(z.object({
            participants: z.array(z.object({
              id: z.string().describe('参与者唯一ID'),
              name: z.string().describe('参与者姓名'),
              department: z.string().optional().describe('部门（可选）'),
            })).describe('参与人员列表'),
            summary: z.string().describe('参与人员摘要描述，用于向用户展示'),
          })),
          execute: async ({ participants, summary }) => {
            return {
              participants,
              summary,
              totalCount: participants.length,
            };
          },
        }),

        configureRound: tool({
          description: '配置抽奖轮次。从用户的自然语言输入中提取轮次序号、奖品名称和奖品数量。',
          inputSchema: zodSchema(z.object({
            roundNumber: z.number().int().positive().describe('轮次序号，必须是正整数'),
            prizeName: z.string().min(1).describe('奖品名称'),
            prizeQuantity: z.number().int().positive().describe('奖品数量，必须是正整数'),
          })),
          execute: async ({ roundNumber, prizeName, prizeQuantity }) => {
            // Validate round configuration
            const validation = validateRound({ roundNumber, prizeName, prizeQuantity });
            if (!validation.valid) {
              return {
                success: false,
                error: validation.errors.join('; '),
              };
            }

            return {
              success: true,
              roundNumber,
              prizeName,
              prizeQuantity,
              description: `第${roundNumber}轮抽奖：${prizeName}，共${prizeQuantity}个名额`,
            };
          },
        }),

        executeLottery: tool({
          description: '执行抽奖，从可参与人员中随机选择中奖者。必须按轮次顺序执行。',
          inputSchema: zodSchema(z.object({
            roundId: z.string().describe('要执行的轮次ID'),
            roundNumber: z.number().int().positive().describe('轮次序号'),
            prizeName: z.string().describe('奖品名称'),
            prizeQuantity: z.number().int().positive().describe('奖品数量'),
          })),
          execute: async ({ roundId, roundNumber, prizeName, prizeQuantity }) => {
            // Check if round can be executed (sequential enforcement)
            if (!canExecuteRound(roundNumber, rounds)) {
              return {
                success: false,
                error: `无法执行第${roundNumber}轮抽奖。请确保之前的轮次已完成。`,
              };
            }

            // Check if there are enough eligible participants
            if (eligibleParticipants.length === 0) {
              return {
                success: false,
                error: '没有可参与抽奖的人员。',
              };
            }

            // Determine actual winner count (min of prizeQuantity and eligible participants)
            const actualWinnerCount = Math.min(prizeQuantity, eligibleParticipants.length);

            // Randomly select winners
            const shuffled = [...eligibleParticipants].sort(() => Math.random() - 0.5);
            const selectedWinners = shuffled.slice(0, actualWinnerCount);

            const winnerResults: Winner[] = selectedWinners.map((participant) => ({
              id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              participantId: participant.id,
              participantName: participant.name,
              roundId,
              prizeName,
              wonAt: Date.now(),
            }));

            const round: LotteryRound = {
              id: roundId,
              roundNumber,
              prizeName,
              prizeQuantity,
              status: 'completed',
              createdAt: Date.now(),
            };

            return {
              success: true,
              round,
              winners: winnerResults,
              remainingCount: eligibleParticipants.length - actualWinnerCount,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Build context message with current lottery state
 */
function buildContextMessage(
  participants: Participant[],
  rounds: LotteryRound[],
  winners: Winner[],
  eligibleParticipants: Participant[]
): string {
  const parts: string[] = ['## 当前抽奖状态：'];

  // Participants info
  if (participants.length > 0) {
    parts.push(`- 总参与人数：${participants.length}人`);
    parts.push(`- 可参与抽奖人数：${eligibleParticipants.length}人`);
  } else {
    parts.push('- 尚未导入参与人员');
  }

  // Rounds info
  if (rounds.length > 0) {
    const completedRounds = rounds.filter(r => r.status === 'completed').length;
    const pendingRounds = rounds.filter(r => r.status === 'pending').length;
    parts.push(`- 已配置轮次：${rounds.length}轮（已完成${completedRounds}轮，待执行${pendingRounds}轮）`);

    // List rounds
    parts.push('\n### 轮次详情：');
    rounds.forEach(r => {
      const status = r.status === 'completed' ? '✅ 已完成' : '⏳ 待执行';
      parts.push(`- 第${r.roundNumber}轮：${r.prizeName} x ${r.prizeQuantity} [${status}]`);
    });
  } else {
    parts.push('- 尚未配置抽奖轮次');
  }

  // Winners info
  if (winners.length > 0) {
    parts.push(`\n### 已中奖人员（${winners.length}人）：`);
    const winnersByRound = winners.reduce((acc, w) => {
      if (!acc[w.roundId]) acc[w.roundId] = [];
      acc[w.roundId].push(w);
      return acc;
    }, {} as Record<string, Winner[]>);

    Object.entries(winnersByRound).forEach(([, roundWinners]) => {
      if (roundWinners.length > 0) {
        const prize = roundWinners[0].prizeName;
        const names = roundWinners.map(w => w.participantName).join('、');
        parts.push(`- ${prize}：${names}`);
      }
    });
  }

  // Eligible participants for next draw
  if (eligibleParticipants.length > 0 && eligibleParticipants.length <= 20) {
    parts.push(`\n### 可参与抽奖人员名单：`);
    parts.push(eligibleParticipants.map(p => p.name).join('、'));
  } else if (eligibleParticipants.length > 20) {
    parts.push(`\n### 可参与抽奖人员（前20人）：`);
    parts.push(eligibleParticipants.slice(0, 20).map(p => p.name).join('、'));
    parts.push(`...等共${eligibleParticipants.length}人`);
  }

  return parts.join('\n');
}

function createChatModel(provider: AIProviderId, model: string) {
  switch (provider) {
    case 'openai':
      return openai(model);
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`不支持的 AI Provider: ${exhaustiveCheck}`);
    }
  }
}
