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

export function WheelOfFortune({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [rotation, setRotation] = useState(0);
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);
  const [showResult, setShowResult] = useState(false);
  const winnersRef = useRef<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    // 随机选择中奖者
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    // 计算旋转
    const spins = 5 + Math.random() * 3;
    const targetRotation = spins * 360 + Math.random() * 360;

    setRotation(targetRotation);
    setShowResult(false);

    const timer = setTimeout(() => {
      setCurrentWinners(winnersRef.current);
      setShowResult(true);
      onComplete(winnersRef.current);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  const segmentAngle = 360 / Math.max(participants.length, 1);
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <div className="relative">
        {/* 指针 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-500" />
        </div>

        {/* 转盘 */}
        <motion.div
          className="w-80 h-80 rounded-full relative overflow-hidden shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{ duration: durationMs / 1000, ease: [0.17, 0.67, 0.12, 0.99] }}
          style={{ transformOrigin: 'center center' }}
        >
          {participants.slice(0, 12).map((p, i) => (
            <div
              key={p.id}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${i * segmentAngle}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle * Math.PI) / 360)}% 0%)`,
                backgroundColor: colors[i % colors.length],
              }}
            >
              <div
                className="absolute text-xs font-bold text-white truncate"
                style={{
                  top: '20%',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${segmentAngle / 2}deg)`,
                  maxWidth: '60px',
                }}
              >
                {p.name}
              </div>
            </div>
          ))}
          {/* 中心圆 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
        </motion.div>
      </div>

      {/* 结果展示 */}
      {showResult && currentWinners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <h3 className="text-2xl font-bold text-yellow-500 mb-4">🎉 恭喜中奖 🎉</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {currentWinners.map(w => (
              <div key={w.id} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg">
                <p className="font-bold text-lg">{w.name}</p>
                <p className="text-sm opacity-90">{w.department}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isRunning && !showResult && (
        <p className="mt-8 text-slate-500">点击开始抽奖按钮启动转盘</p>
      )}
    </div>
  );
}
