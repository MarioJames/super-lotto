'use client';

import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import type { Participant } from '@/lib/types';

interface WinnerResultsDisplayProps {
  winners: Participant[];
  prizeName: string;
}

// 预生成随机位置数据的类型
interface ParticleStyle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration?: string;
  opacity: number;
  width: string;
  height: string;
}

// 使用伪随机数生成器，基于索引生成确定性的"随机"值
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// 预生成星星样式（基于索引的确定性值）
function generateStarStyles(): ParticleStyle[] {
  return Array.from({ length: 20 }, (_, i) => ({
    left: `${seededRandom(i * 5 + 1) * 100}%`,
    top: `${seededRandom(i * 5 + 2) * 100}%`,
    animationDelay: `${seededRandom(i * 5 + 3) * 2}s`,
    opacity: 0.6,
    width: `${12 + seededRandom(i * 5 + 4) * 12}px`,
    height: `${12 + seededRandom(i * 5 + 5) * 12}px`,
  }));
}

// 预生成闪光样式（基于索引的确定性值）
function generateSparkleStyles(): ParticleStyle[] {
  return Array.from({ length: 15 }, (_, i) => ({
    left: `${seededRandom(i * 6 + 100) * 100}%`,
    top: `${seededRandom(i * 6 + 101) * 100}%`,
    animationDelay: `${seededRandom(i * 6 + 102) * 3}s`,
    animationDuration: `${1 + seededRandom(i * 6 + 103) * 2}s`,
    opacity: 0.5,
    width: `${16 + seededRandom(i * 6 + 104) * 8}px`,
    height: `${16 + seededRandom(i * 6 + 105) * 8}px`,
  }));
}

// 在模块级别预生成样式（只执行一次）
const STAR_STYLES = generateStarStyles();
const SPARKLE_STYLES = generateSparkleStyles();

/**
 * 中奖者结果展示组件
 * Property 10: Winner Display Completeness
 * 对于任何中奖者列表，渲染输出应显示每位中奖者的序号、姓名和部门信息
 * Requirements: 5.1, 5.2
 */
export function WinnerResultsDisplay({ winners, prizeName }: WinnerResultsDisplayProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [visibleWinners, setVisibleWinners] = useState<number[]>([]);

  // 逐个显示中奖者动画
  useEffect(() => {
    winners.forEach((_, index) => {
      setTimeout(() => {
        setVisibleWinners(prev => [...prev, index]);
      }, index * 200);
    });

    // 5秒后隐藏彩带效果
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [winners]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* 彩带/庆祝效果背景 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 动态星星效果 */}
          {STAR_STYLES.map((style, i) => (
            <Star
              key={i}
              className="absolute text-yellow-400 animate-pulse"
              style={style}
            />
          ))}
          {/* 闪光效果 */}
          {SPARKLE_STYLES.map((style, i) => (
            <Sparkles
              key={`sparkle-${i}`}
              className="absolute text-amber-300 animate-bounce"
              style={style}
            />
          ))}
        </div>
      )}

      {/* 标题区域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-10 w-10 text-yellow-400 animate-bounce" />
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400">
            恭喜中奖！
          </h2>
          <Trophy className="h-10 w-10 text-yellow-400 animate-bounce" />
        </div>
        <p className="text-xl text-white/80">
          <span className="text-amber-400 font-semibold">{prizeName}</span>
          <span className="mx-2">·</span>
          <span>{winners.length} 位幸运儿</span>
        </p>
      </div>

      {/* 中奖者列表 */}
      <div className="grid gap-3 max-h-[400px] overflow-y-auto px-4 py-2 custom-scrollbar">
        {winners.map((winner, index) => (
          <div
            key={winner.id}
            className={`
              transform transition-all duration-500 ease-out
              ${visibleWinners.includes(index)
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'}
            `}
          >
            <WinnerCard
              winner={winner}
              sequenceNumber={index + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}


/**
 * 单个中奖者卡片组件
 * 显示序号、姓名和部门信息
 */
interface WinnerCardProps {
  winner: Participant;
  sequenceNumber: number;
}

function WinnerCard({ winner, sequenceNumber }: WinnerCardProps) {
  return (
    <div className="relative group">
      {/* 发光边框效果 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300" />

      {/* 卡片内容 */}
      <div className="relative flex items-center gap-4 bg-slate-900/90 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10">
        {/* 序号徽章 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span className="text-slate-900 font-bold text-lg">{sequenceNumber}</span>
        </div>

        {/* 中奖者信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {winner.name}
          </h3>
          <p className="text-sm text-white/60 truncate">
            {winner.department || '未设置部门'}
          </p>
        </div>

        {/* 装饰图标 */}
        <div className="flex-shrink-0">
          <Sparkles className="h-5 w-5 text-amber-400 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export default WinnerResultsDisplay;
