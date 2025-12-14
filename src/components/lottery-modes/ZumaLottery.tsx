'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Participant } from '@/lib/types';
import { CinematicStage, type CinematicPhase } from './CinematicStage';

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

const ZUMA_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#FF5722'] as const;

export function ZumaLottery({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [rotation, setRotation] = useState(0);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [phase, setPhase] = useState<CinematicPhase>('idle');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const winnersRef = useRef<Participant[]>([]);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));
    const winnerIds = new Set(winnersRef.current.map(w => w.id));

    // 创建球链（确保中奖者一定在球链中）
    const desiredBallCount = Math.min(participants.length, Math.max(16, Math.min(24, winnersRef.current.length * 3)));
    const picked = new Map<number, Participant>();
    for (const p of winnersRef.current) {
      if (picked.size >= desiredBallCount) break;
      picked.set(p.id, p);
    }
    const rest = [...participants].filter(p => !picked.has(p.id)).sort(() => Math.random() - 0.5);
    for (const p of rest) {
      if (picked.size >= desiredBallCount) break;
      picked.set(p.id, p);
    }
    const ballParticipants = Array.from(picked.values()).sort(() => Math.random() - 0.5);
    const angleStep = 360 / Math.max(ballParticipants.length, 1);
    const initialBalls: Ball[] = ballParticipants.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: ZUMA_COLORS[i % ZUMA_COLORS.length],
      angle: i * angleStep,
      isWinner: winnerIds.has(p.id),
      popped: false,
    }));

    setBalls(initialBalls);
    setPhase('drawing');
    setOverlayOpen(true);
    setWinners([]);
    setRotation(0);

    // 旋转阶段
    let rot = 0;
    const spinInterval = window.setInterval(() => {
      rot += 6;
      setRotation(rot);
    }, 28);

    const spinMs = Math.max(900, Math.floor(durationMs * 0.62));
    const remainingMs = Math.max(0, durationMs - spinMs);
    const popIntervalMs = Math.max(120, Math.min(700, Math.floor(remainingMs / Math.max(1, winnersRef.current.length + 1))));

    let popIntervalId: number | null = null;

    // 停止旋转，开始弹出中奖球
    const popStartTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      window.clearInterval(spinInterval);
      setPhase('revealing');

      let popIndex = 0;
      popIntervalId = window.setInterval(() => {
        if (runId !== runIdRef.current) return;
        if (popIndex < winnersRef.current.length) {
          const winnerId = winnersRef.current[popIndex].id;
          setBalls(prev => prev.map(b => b.id === winnerId ? { ...b, popped: true } : b));
          popIndex++;
        } else if (popIntervalId != null) {
          window.clearInterval(popIntervalId);
          popIntervalId = null;
        }
      }, popIntervalMs);
    }, spinMs);

    const doneTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      window.clearInterval(spinInterval);
      if (popIntervalId != null) window.clearInterval(popIntervalId);
      setWinners(winnersRef.current);
      setPhase('done');
      onComplete(winnersRef.current);
    }, durationMs);

    const closeTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setOverlayOpen(false);
    }, durationMs + 2800);

    return () => {
      window.clearInterval(spinInterval);
      if (popIntervalId != null) window.clearInterval(popIntervalId);
      window.clearTimeout(popStartTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="祖玛抽奖"
        subtitle={phase === 'drawing' ? '球链高速旋转中…' : phase === 'revealing' ? '正在点爆中奖球…' : '结果已生成'}
        winners={winners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide mb-8">🐸 祖玛抽奖 🐸</h2>

          {/* 祖玛球链（3D 轨道） */}
          <div className="relative" style={{ width: 'min(72vw, 520px)', height: 'min(72vw, 520px)', perspective: '1200px' }}>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ duration: 0 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {balls.map(ball => (
                <motion.div
                  key={ball.id}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${ball.angle}deg) translateY(-${Math.min(210, Math.max(140, balls.length * 10))}px) rotate(-${ball.angle}deg)`,
                  }}
                  animate={
                    ball.popped
                      ? {
                          scale: [1, 1.65, 0],
                          opacity: [1, 1, 0],
                          y: [0, -60],
                        }
                      : undefined
                  }
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <div
                    className={`rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg -translate-x-1/2 -translate-y-1/2 ${
                      ball.isWinner ? 'ring-4 ring-yellow-300' : ''
                    }`}
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: ball.color,
                      boxShadow: '0 26px 80px rgba(0,0,0,0.45)',
                      transform: 'translateZ(30px)',
                    }}
                  >
                    {ball.name.slice(0, 2)}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 中心青蛙 */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
              animate={phase === 'drawing' ? { rotate: [0, 6, 0] } : undefined}
              transition={{ duration: 0.6, repeat: phase === 'drawing' ? Infinity : 0, ease: 'easeInOut' }}
              style={{ fontSize: 84, filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.45))' }}
            >
              🐸
            </motion.div>

            {/* 发射/点爆效果 */}
            {phase === 'revealing' && (
              <motion.div
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(253,224,71,1), rgba(253,224,71,0.15) 70%, transparent 72%)' }}
                animate={{ scale: [0, 3, 0], opacity: [1, 0.6, 0] }}
                transition={{ duration: 0.32, repeat: Infinity }}
              />
            )}
          </div>

          <div className="mt-6 text-center">
            {phase === 'drawing' && <div className="text-sm text-white/70">球链旋转，等待点爆…</div>}
            {phase === 'revealing' && <div className="text-sm text-white/70">点爆进行中…</div>}
          </div>
        </div>
      </CinematicStage>

      <div className="flex flex-col items-center justify-center min-h-[500px]">
        {winners.length > 0 ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-600 mb-4">🎯 命中目标！🎯</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {winners.map(w => (
                <div key={w.id} className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-6 py-3 rounded-lg shadow-lg">
                  <p className="font-bold">{w.name}</p>
                  <p className="text-sm opacity-90">{w.department}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-slate-500">点击开始抽奖按钮启动祖玛（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
