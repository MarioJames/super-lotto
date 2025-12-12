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

export function SlotMachine({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [columns, setColumns] = useState<{ items: string[]; finalIndex: number; stopped: boolean }[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [showResult, setShowResult] = useState(false);
  const winnersRef = useRef<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    // 创建3列滚动
    const names = participants.map(p => p.name);
    const cols = winnersRef.current.map((winner, i) => {
      const shuffledNames = [...names].sort(() => Math.random() - 0.5);
      const finalIndex = shuffledNames.indexOf(winner.name);
      return {
        items: [...shuffledNames, ...shuffledNames, ...shuffledNames],
        finalIndex: names.length + finalIndex,
        stopped: false,
      };
    });
    setColumns(cols);
    setShowResult(false);

    // 依次停止每列
    const stopInterval = durationMs / (cols.length + 1);
    cols.forEach((_, i) => {
      setTimeout(() => {
        setColumns(prev => prev.map((col, idx) => idx === i ? { ...col, stopped: true } : col));
      }, stopInterval * (i + 1));
    });

    setTimeout(() => {
      setWinners(winnersRef.current);
      setShowResult(true);
      onComplete(winnersRef.current);
    }, durationMs);
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <h2 className="text-3xl font-bold mb-8">🎰 老虎机抽奖 🎰</h2>

      {/* 老虎机 */}
      <div className="bg-gradient-to-b from-red-600 to-red-800 p-8 rounded-2xl shadow-2xl">
        <div className="bg-black p-4 rounded-lg">
          <div className="flex gap-2">
            {columns.length > 0 ? columns.map((col, i) => (
              <div key={i} className="w-24 h-32 bg-white rounded overflow-hidden relative">
                <motion.div
                  className="absolute w-full"
                  initial={{ y: 0 }}
                  animate={{ y: col.stopped ? -col.finalIndex * 32 : [-1000, 0] }}
                  transition={col.stopped
                    ? { duration: 0.5, ease: 'easeOut' }
                    : { duration: 0.1, repeat: Infinity, ease: 'linear' }
                  }
                >
                  {col.items.map((name, j) => (
                    <div key={j} className="h-8 flex items-center justify-center text-sm font-bold truncate px-1">
                      {name}
                    </div>
                  ))}
                </motion.div>
                {/* 中线 */}
                <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-2 border-yellow-400 pointer-events-none" />
              </div>
            )) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="w-24 h-32 bg-white rounded flex items-center justify-center">
                  <span className="text-4xl">?</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 拉杆 */}
        <div className="flex justify-center mt-4">
          <div className="w-4 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full shadow-lg" />
          </div>
        </div>
      </div>

      {/* 结果 */}
      {showResult && winners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 text-center"
        >
          <h3 className="text-2xl font-bold text-yellow-500 mb-4">🎉 JACKPOT! 🎉</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {winners.map(w => (
              <div key={w.id} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg">
                <p className="font-bold">{w.name}</p>
                <p className="text-sm opacity-90">{w.department}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isRunning && columns.length === 0 && (
        <p className="mt-8 text-slate-500">点击开始抽奖按钮拉动拉杆</p>
      )}
    </div>
  );
}
