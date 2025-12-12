'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Participant } from '@/lib/types';

interface Props {
  participants: Participant[];
  winnerCount: number;
  durationMs: number;
  onComplete: (winners: Participant[]) => void;
  isRunning: boolean;
}

interface Horse {
  id: number;
  name: string;
  position: number;
  finished: boolean;
  finishOrder: number;
  color: string;
}

export function HorseRace({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const winnersRef = useRef<Participant[]>([]);
  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'];

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    // 初始化赛马
    const initialHorses: Horse[] = participants.slice(0, 8).map((p, i) => ({
      id: p.id,
      name: p.name,
      position: 0,
      finished: false,
      finishOrder: 0,
      color: colors[i % colors.length],
    }));
    setHorses(initialHorses);
    setRaceFinished(false);

    let finishCount = 0;
    const winnerIds = new Set(winnersRef.current.map(w => w.id));

    // 赛跑动画
    const interval = setInterval(() => {
      setHorses(prev => {
        const updated = prev.map(horse => {
          if (horse.finished) return horse;

          // 中奖者跑得更快
          const isWinner = winnerIds.has(horse.id);
          const speed = isWinner
            ? 2 + Math.random() * 3
            : 1 + Math.random() * 2;

          const newPosition = Math.min(horse.position + speed, 100);

          if (newPosition >= 100 && !horse.finished) {
            finishCount++;
            return { ...horse, position: 100, finished: true, finishOrder: finishCount };
          }
          return { ...horse, position: newPosition };
        });
        return updated;
      });
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setHorses(prev => prev.map(h => ({ ...h, position: 100, finished: true })));
      setRaceFinished(true);
      onComplete(winnersRef.current);
    }, durationMs);

    return () => clearInterval(interval);
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  const sortedHorses = [...horses].sort((a, b) => b.position - a.position);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">🏇 赛马抽奖 🏇</h2>

      {/* 赛道 */}
      <div className="w-full bg-green-800 rounded-lg p-4 relative">
        {/* 终点线 */}
        <div className="absolute right-8 top-0 bottom-0 w-2 bg-white opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(0deg, black, black 10px, white 10px, white 20px)' }} />

        {horses.map((horse, i) => (
          <div key={horse.id} className="flex items-center gap-2 mb-2 relative h-10">
            {/* 赛道背景 */}
            <div className="absolute inset-0 bg-green-700 rounded" />

            {/* 马 */}
            <motion.div
              className="absolute flex items-center gap-1 z-10"
              style={{ left: `${horse.position}%` }}
              animate={{ left: `${horse.position}%` }}
              transition={{ duration: 0.05 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: horse.color }}
              >
                {i + 1}
              </div>
              <span className="text-white text-xs font-medium bg-black/50 px-1 rounded truncate max-w-20">
                {horse.name}
              </span>
            </motion.div>
          </div>
        ))}
      </div>

      {/* 排名 */}
      {raceFinished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 w-full"
        >
          <h3 className="text-xl font-bold text-center mb-4">🏆 比赛结果 🏆</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sortedHorses.slice(0, winnerCount).map((horse, i) => (
              <div
                key={horse.id}
                className={`p-4 rounded-lg text-center ${
                  i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-400' : 'bg-slate-200'
                }`}
              >
                <div className="text-2xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</div>
                <p className="font-bold">{horse.name}</p>
                <p className="text-sm text-slate-600">第 {i + 1} 名</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isRunning && horses.length === 0 && (
        <p className="mt-8 text-slate-500">点击开始抽奖按钮开始比赛</p>
      )}
    </div>
  );
}
