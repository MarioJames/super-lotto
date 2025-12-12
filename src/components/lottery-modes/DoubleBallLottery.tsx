'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '@/lib/types';

interface Props {
  participants: Participant[];
  winnerCount: number;
  durationMs: number;
  onComplete: (winners: Participant[]) => void;
  isRunning: boolean;
}

export function DoubleBallLottery({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [balls, setBalls] = useState<{ id: number; name: string; color: string; revealed: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const winnersRef = useRef<Participant[]>([]);

  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    const initialBalls = winnersRef.current.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: colors[i % colors.length],
      revealed: false,
    }));
    setBalls(initialBalls);
    setCurrentIndex(-1);

    const intervalTime = durationMs / (winnersRef.current.length + 1);
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < winnersRef.current.length) {
        setCurrentIndex(idx);
        setBalls(prev => prev.map((b, i) => i === idx ? { ...b, revealed: true } : b));
        idx++;
      } else {
        clearInterval(interval);
        onComplete(winnersRef.current);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-2">🎱 双色球抽奖 🎱</h2>
        <p className="text-slate-500 text-center">共 {winnerCount} 个中奖名额</p>
      </div>

      {/* 摇奖机 */}
      <div className="relative w-64 h-64 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full flex items-center justify-center mb-8 shadow-2xl">
        <div className="absolute inset-4 bg-slate-800 rounded-full overflow-hidden">
          <AnimatePresence>
            {isRunning && currentIndex < balls.length && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 360, 720] }}
                transition={{ duration: 0.5 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-8 h-8 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                    animate={{
                      x: Math.cos((i * Math.PI * 2) / 8) * 40,
                      y: Math.sin((i * Math.PI * 2) / 8) * 40,
                      rotate: 360,
                    }}
                    transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute bottom-0 w-16 h-8 bg-slate-600 rounded-b-lg" />
      </div>

      {/* 开出的球 */}
      <div className="flex flex-wrap justify-center gap-4 max-w-lg">
        {balls.map((ball, i) => (
          <motion.div
            key={ball.id}
            initial={{ scale: 0, y: -50 }}
            animate={ball.revealed ? { scale: 1, y: 0 } : { scale: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: ball.color }}
            >
              {i + 1}
            </div>
            <p className="mt-2 font-medium text-sm">{ball.name}</p>
          </motion.div>
        ))}
      </div>

      {!isRunning && balls.length === 0 && (
        <p className="text-slate-500">点击开始抽奖按钮启动摇奖机</p>
      )}
    </div>
  );
}
