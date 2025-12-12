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

export function ScratchCard({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [cards, setCards] = useState<{ id: number; name: string; department: string; revealed: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const winnersRef = useRef<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    const initialCards = winnersRef.current.map(p => ({
      id: p.id,
      name: p.name,
      department: p.department,
      revealed: false,
    }));
    setCards(initialCards);
    setCurrentIndex(-1);

    const intervalTime = durationMs / (winnersRef.current.length + 1);
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < winnersRef.current.length) {
        setCurrentIndex(idx);
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === idx ? { ...c, revealed: true } : c));
        }, intervalTime * 0.7);
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
      <h2 className="text-3xl font-bold mb-8">🎫 刮刮乐抽奖 🎫</h2>

      <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
        {cards.map((card, i) => (
          <div key={card.id} className="relative">
            {/* 底层 - 中奖信息 */}
            <div className="w-40 h-48 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-lg text-center">{card.name}</p>
              <p className="text-sm text-yellow-800">{card.department}</p>
              <div className="mt-2 text-2xl">🏆</div>
            </div>

            {/* 刮刮层 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
              initial={{ opacity: 1 }}
              animate={{
                opacity: card.revealed ? 0 : 1,
                scale: card.revealed ? 1.1 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {currentIndex === i && !card.revealed ? (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              ) : null}
              <div className="text-center">
                <p className="text-white font-bold text-lg">刮开有奖</p>
                <p className="text-white/70 text-sm">第 {i + 1} 张</p>
              </div>
              {/* 刮痕效果 */}
              {currentIndex === i && !card.revealed && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                  }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {cards.length === 0 && !isRunning && (
        <p className="text-slate-500">点击开始抽奖按钮开始刮奖</p>
      )}

      {cards.length > 0 && cards.every(c => c.revealed) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-2xl font-bold text-yellow-500"
        >
          🎊 全部刮开！恭喜以上中奖者！🎊
        </motion.p>
      )}
    </div>
  );
}
