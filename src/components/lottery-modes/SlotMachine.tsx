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

export function SlotMachine({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [columns, setColumns] = useState<{ items: string[]; finalIndex: number; stopped: boolean }[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const winnersRef = useRef<Participant[]>([]);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<CinematicPhase>('idle');
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    // 创建3列滚动
    const names = participants.map(p => p.name);
    const cols = winnersRef.current.map(winner => {
      const shuffledNames = [...names].sort(() => Math.random() - 0.5);
      const finalIndex = shuffledNames.indexOf(winner.name);
      return {
        items: [...shuffledNames, ...shuffledNames, ...shuffledNames],
        finalIndex: names.length + finalIndex,
        stopped: false,
      };
    });
    setColumns(cols);
    setWinners([]);
    setPhase('drawing');
    setOverlayOpen(true);

    // 依次停止每列
    const stopInterval = durationMs / (cols.length + 1);
    const stopTimers: number[] = [];
    cols.forEach((_, i) => {
      const t = window.setTimeout(() => {
        if (runId !== runIdRef.current) return;
        setColumns(prev => prev.map((col, idx) => idx === i ? { ...col, stopped: true } : col));
      }, stopInterval * (i + 1));
      stopTimers.push(t);
    });

    const revealTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setPhase('revealing');
    }, Math.max(600, Math.floor(durationMs * 0.72)));

    const doneTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setWinners(winnersRef.current);
      setPhase('done');
      onComplete(winnersRef.current);
    }, durationMs);

    const closeTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setOverlayOpen(false);
    }, durationMs + 2800);

    return () => {
      stopTimers.forEach(t => window.clearTimeout(t));
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="老虎机抽奖"
        subtitle={phase === 'drawing' ? '滚轮高速转动中…' : phase === 'revealing' ? '正在停轮对齐…' : '结果已生成'}
        winners={winners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide mb-6">🎰 老虎机抽奖 🎰</h2>

          {/* 老虎机（3D 机身） */}
          <div className="relative" style={{ perspective: '1200px' }}>
            <div
              className="rounded-3xl p-6 sm:p-8"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateX(10deg)',
                background: 'linear-gradient(180deg, rgba(239,68,68,0.95), rgba(153,27,27,0.92))',
                boxShadow:
                  '0 60px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset',
              }}
            >
              <div className="rounded-2xl bg-black/80 ring-1 ring-white/10 p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {columns.length > 0 ? (
                    columns.map((col, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/10"
                        style={{ height: 140 }}
                      >
                        <motion.div
                          className="absolute w-full"
                          initial={{ y: 0 }}
                          animate={{ y: col.stopped ? -col.finalIndex * 32 : [-1200, 0] }}
                          transition={
                            col.stopped
                              ? { duration: 0.55, ease: 'easeOut' }
                              : { duration: 0.1, repeat: Infinity, ease: 'linear' }
                          }
                        >
                          {col.items.map((name, j) => (
                            <div key={j} className="h-8 flex items-center justify-center text-sm font-bold truncate px-1">
                              {name}
                            </div>
                          ))}
                        </motion.div>
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 border-2 border-yellow-400" />
                        <div
                          className="pointer-events-none absolute inset-0 opacity-40"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(0,0,0,0.35), transparent 35%, transparent 65%, rgba(0,0,0,0.35))',
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-[140px] rounded-xl bg-white/90 flex items-center justify-center">
                        <span className="text-4xl">?</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 拉杆 */}
              <div className="flex justify-center mt-5">
                <motion.div
                  className="relative"
                  animate={phase === 'drawing' ? { rotateZ: [0, 10, 0] } : undefined}
                  transition={{ duration: 0.45, repeat: phase === 'drawing' ? Infinity : 0, ease: 'easeInOut' }}
                >
                  <div className="w-4 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-rose-500 rounded-full shadow-lg ring-1 ring-white/20" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            {phase === 'drawing' && <div className="text-sm text-white/70">拉杆已触发，正在滚动…</div>}
            {phase === 'revealing' && <div className="text-sm text-white/70">逐列停轮，对齐中奖者…</div>}
          </div>
        </div>
      </CinematicStage>

      <div className="flex flex-col items-center justify-center min-h-[500px]">
        {winners.length > 0 ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">🎉 JACKPOT! 🎉</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {winners.map(w => (
                <div key={w.id} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg">
                  <p className="font-bold">{w.name}</p>
                  <p className="text-sm opacity-90">{w.department}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-slate-500">点击开始抽奖按钮拉动拉杆（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
