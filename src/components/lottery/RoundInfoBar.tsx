'use client';

import { Trophy, Users, Sparkles } from 'lucide-react';
import type { Round } from '@/lib/types';
import { LotteryMode } from '@/lib/types';

interface RoundInfoBarProps {
  round: Round;
  roundIndex: number;
  totalRounds: number;
  availableCount: number;
}

// 抽奖模式名称映射
const LOTTERY_MODE_NAMES: Record<LotteryMode, string> = {
  [LotteryMode.WHEEL]: '转盘',
  [LotteryMode.DOUBLE_BALL]: '双色球',
  [LotteryMode.SCRATCH]: '刮刮乐',
  [LotteryMode.ZUMA]: '祖玛',
  [LotteryMode.HORSE_RACE]: '赛马',
  [LotteryMode.SLOT_MACHINE]: '老虎机',
};

/**
 * 轮次信息栏组件
 * Property 4: Round Information Display Completeness
 * 对于任何正在显示的轮次，渲染输出应包含奖品名称、中奖人数和抽奖模式信息
 * Requirements: 2.2
 */
export function RoundInfoBar({
  round,
  roundIndex,
  totalRounds,
  availableCount,
}: RoundInfoBarProps) {
  const modeName = LOTTERY_MODE_NAMES[round.lotteryMode] || '未知模式';
  const isInsufficientParticipants = availableCount < round.winnerCount;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 左侧：轮次和奖品信息 */}
        <div className="flex items-center gap-4">
          {/* 轮次徽章 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-lg">{roundIndex + 1}</span>
          </div>

          {/* 奖品信息 */}
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">{round.prizeName}</h2>
            </div>
            {round.prizeDescription && (
              <p className="text-sm text-white/50 mt-0.5">{round.prizeDescription}</p>
            )}
          </div>
        </div>

        {/* 右侧：统计信息 */}
        <div className="flex items-center gap-6 text-sm">
          {/* 轮次进度 */}
          <div className="text-center">
            <p className="text-white/50">轮次</p>
            <p className="text-white font-medium">
              {roundIndex + 1} / {totalRounds}
            </p>
          </div>

          {/* 中奖人数 */}
          <div className="text-center">
            <p className="text-white/50">中奖人数</p>
            <p className="text-amber-400 font-medium">{round.winnerCount} 人</p>
          </div>

          {/* 可用人数 */}
          <div className="text-center">
            <p className="text-white/50">可用人数</p>
            <p className={`font-medium flex items-center gap-1 ${isInsufficientParticipants ? 'text-red-400' : 'text-green-400'}`}>
              <Users className="h-3.5 w-3.5" />
              {availableCount} 人
            </p>
          </div>

          {/* 抽奖模式 */}
          <div className="text-center">
            <p className="text-white/50">抽奖模式</p>
            <p className="text-purple-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {modeName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoundInfoBar;
