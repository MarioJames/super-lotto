'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '@/lib/types';
import { CinematicStage, type CinematicPhase } from './CinematicStage';

interface Props {
  participants: Participant[];
  winnerCount: number;
  durationMs: number;
  onComplete: (winners: Participant[]) => void;
  isRunning: boolean;
}

const BALL_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'] as const;

export function DoubleBallLottery({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [balls, setBalls] = useState<{ id: number; name: string; color: string; revealed: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);
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

    const initialBalls = winnersRef.current.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: BALL_COLORS[i % BALL_COLORS.length],
      revealed: false,
    }));
    setBalls(initialBalls);
    setCurrentIndex(-1);
    setCurrentWinners([]);
    setOverlayOpen(true);
    setPhase('drawing');

    const intervalTime = durationMs / (winnersRef.current.length + 1);
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < winnersRef.current.length) {
        setCurrentIndex(idx);
        setPhase('revealing');
        setBalls(prev => prev.map((b, i) => i === idx ? { ...b, revealed: true } : b));
        idx++;
      } else {
        clearInterval(interval);
        if (runId !== runIdRef.current) return;
        setCurrentWinners(winnersRef.current);
        setPhase('done');
        onComplete(winnersRef.current);
      }
    }, intervalTime);

    const closeTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setOverlayOpen(false);
    }, durationMs + 2800);

    return () => {
      clearInterval(interval);
      window.clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="双色球抽奖"
        subtitle={phase === 'drawing' ? '摇奖机高速运转中…' : phase === 'revealing' ? '正在开球…' : '结果已生成'}
        winners={currentWinners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide">🎱 双色球抽奖 🎱</h2>
            <p className="text-white/70 text-sm mt-1">共 {winnerCount} 个中奖名额</p>
          </div>

          {/* 摇奖机（玻璃球舱 + 3D 质感） */}
          <div className="relative" style={{ perspective: '1100px' }}>
            <motion.div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: 'min(56vw, 380px)',
                height: 'min(56vw, 380px)',
                transformStyle: 'preserve-3d',
                rotateX: 14,
                boxShadow:
                  '0 50px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 80px rgba(34,211,238,0.10)',
                background: 'linear-gradient(180deg, rgba(30,41,59,0.9), rgba(2,6,23,0.92))',
              }}
            >
              <div className="absolute inset-5 rounded-full overflow-hidden bg-black/20 ring-1 ring-white/10">
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 55%), radial-gradient(circle at 70% 75%, rgba(34,211,238,0.18), transparent 60%)',
                  }}
                />
                <AnimatePresence>
                  {phase !== 'idle' && currentIndex < balls.length && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.25, 1], rotate: [0, 360, 900] }}
                      transition={{ duration: 0.65 }}
                    >
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: 22 + (i % 3) * 5,
                            height: 22 + (i % 3) * 5,
                            backgroundColor: BALL_COLORS[i % BALL_COLORS.length],
                            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                          }}
                          animate={
                            phase === 'drawing'
                              ? {
                                  x: Math.cos((i * Math.PI * 2) / 10) * 70,
                                  y: Math.sin((i * Math.PI * 2) / 10) * 70,
                                  rotate: 360,
                                }
                              : {
                                  x: Math.cos((i * Math.PI * 2) / 10) * 52,
                                  y: Math.sin((i * Math.PI * 2) / 10) * 52,
                                  rotate: 180,
                                }
                          }
                          transition={{ duration: 0.28, repeat: Infinity, ease: 'linear' }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 玻璃高光 */}
              <div
                className="absolute inset-0 rounded-full opacity-45 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.40), transparent 52%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.14), transparent 60%)',
                  mixBlendMode: 'screen',
                }}
              />

              <div className="absolute -bottom-4 h-10 w-24 rounded-b-2xl bg-white/8 ring-1 ring-white/10 backdrop-blur" />
            </motion.div>
          </div>

          {/* 开出的球 */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-3xl">
            {balls.map((ball, i) => (
              <motion.div
                key={ball.id}
                initial={{ scale: 0, y: -50 }}
                animate={ball.revealed ? { scale: 1, y: 0 } : { scale: 0, y: -50 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="flex flex-col items-center"
              >
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-1 ring-white/20"
                  style={{
                    width: 62,
                    height: 62,
                    backgroundColor: ball.color,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                  }}
                >
                  {i + 1}
                </div>
                <p className="mt-2 font-medium text-sm text-white/90">{ball.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </CinematicStage>

      <div className="flex flex-col items-center justify-center min-h-[500px]">
        {currentWinners.length > 0 ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">🎉 恭喜中奖 🎉</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {currentWinners.map(w => (
                <div
                  key={w.id}
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg"
                >
                  <p className="font-bold text-lg">{w.name}</p>
                  <p className="text-sm opacity-90">{w.department}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-500">点击开始抽奖按钮启动摇奖机（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
