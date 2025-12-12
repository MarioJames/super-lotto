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

interface Ball {
  id: number;
  name: string;
  color: string;
  angle: number;
  isWinner: boolean;
  popped: boolean;
}

export function ZumaLottery({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [rotation, setRotation] = useState(0);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [phase, setPhase] = useState<'spinning' | 'popping' | 'done'>('spinning');
  const winnersRef = useRef<Participant[]>([]);
  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#FF5722'];

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));
    const winnerIds = new Set(winnersRef.current.map(w => w.id));

    // 创建球链
    const ballCount = Math.min(participants.length, 16);
    const angleStep = 360 / ballCount;
    const initialBalls: Ball[] = participants.slice(0, ballCount).map((p, i) => ({
      id: p.id,
      name: p.name,
      color: colors[i % colors.length],
      angle: i * angleStep,
      isWinner: winnerIds.has(p.id),
      popped: false,
    }));
    setBalls(initialBalls);
    setPhase('spinning');
    setWinners([]);

    // 旋转阶段
    let rot = 0;
    const spinInterval = setInterval(() => {
      rot += 5;
      setRotation(rot);
    }, 30);

    // 停止旋转，开始弹出中奖球
    setTimeout(() => {
      clearInterval(spinInterval);
      setPhase('popping');

      // 依次弹出中奖球
      let popIndex = 0;
      const popInterval = setInterval(() => {
        if (popIndex < winnersRef.current.length) {
          const winnerId = winnersRef.current[popIndex].id;
          setBalls(prev => prev.map(b => b.id === winnerId ? { ...b, popped: true } : b));
          popIndex++;
        } else {
          clearInterval(popInterval);
          setWinners(winnersRef.current);
          setPhase('done');
          onComplete(winnersRef.current);
        }
      }, 500);
    }, durationMs * 0.7);

    return () => clearInterval(spinInterval);
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <h2 className="text-3xl font-bold mb-8">🐸 祖玛抽奖 🐸</h2>

      {/* 祖玛球链 */}
      <div className="relative w-80 h-80">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: rotation }}
          transition={{ duration: 0 }}
        >
          {balls.map(ball => (
            <motion.div
              key={ball.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${ball.angle}deg) translateY(-120px) rotate(-${ball.angle}deg)`,
              }}
              animate={ball.popped ? {
                scale: [1, 1.5, 0],
                opacity: [1, 1, 0],
                y: [0, -50],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg -translate-x-1/2 -translate-y-1/2 ${
                  ball.isWinner ? 'ring-4 ring-yellow-400' : ''
                }`}
                style={{ backgroundColor: ball.color }}
              >
                {ball.name.slice(0, 2)}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 中心青蛙 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">
          🐸
        </div>

        {/* 发射效果 */}
        {phase === 'popping' && (
          <motion.div
            className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full"
            animate={{
              scale: [0, 2, 0],
              opacity: [1, 0.5, 0],
            }}
            transition={{ duration: 0.3, repeat: Infinity }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        )}
      </div>

      {/* 中奖结果 */}
      {phase === 'done' && winners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <h3 className="text-2xl font-bold text-green-500 mb-4">🎯 命中目标！🎯</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {winners.map(w => (
              <div key={w.id} className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-6 py-3 rounded-lg shadow-lg">
                <p className="font-bold">{w.name}</p>
                <p className="text-sm opacity-90">{w.department}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isRunning && balls.length === 0 && (
        <p className="mt-8 text-slate-500">点击开始抽奖按钮启动祖玛</p>
      )}
    </div>
  );
}
