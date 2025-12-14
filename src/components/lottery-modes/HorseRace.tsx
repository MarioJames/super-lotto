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

interface Horse {
  id: number;
  name: string;
  position: number;
  finished: boolean;
  finishOrder: number;
  color: string;
  targetTimeMs: number;
}

const HORSE_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'] as const;

export function HorseRace({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const winnersRef = useRef<Participant[]>([]);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<CinematicPhase>('idle');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [winners, setWinners] = useState<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));
    const winnerIds = new Set(winnersRef.current.map(w => w.id));

    // 初始化赛马（保证赛道里包含中奖者）
    const laneCount = Math.min(participants.length, Math.max(8, Math.min(12, winnersRef.current.length + 4)));
    const picked = new Map<number, Participant>();
    for (const p of winnersRef.current) {
      if (picked.size >= laneCount) break;
      picked.set(p.id, p);
    }
    const rest = [...participants].filter(p => !picked.has(p.id)).sort(() => Math.random() - 0.5);
    for (const p of rest) {
      if (picked.size >= laneCount) break;
      picked.set(p.id, p);
    }

    const lanes = Array.from(picked.values()).sort(() => Math.random() - 0.5);

    const winnerMax = Math.floor(durationMs * 0.64);
    const winnerMin = Math.floor(durationMs * 0.44);
    const otherMin = Math.floor(durationMs * 0.74);
    const otherMax = Math.floor(durationMs * 0.94);

    const winnerTimeById = new Map<number, number>();
    winnersRef.current.forEach((w, i) => {
      const t = Math.min(winnerMax, winnerMin + i * Math.floor((winnerMax - winnerMin) / Math.max(1, winnersRef.current.length)));
      winnerTimeById.set(w.id, t);
    });

    let initialHorses: Horse[] = lanes.map((p, i) => ({
      id: p.id,
      name: p.name,
      position: 0,
      finished: false,
      finishOrder: 0,
      color: HORSE_COLORS[i % HORSE_COLORS.length],
      targetTimeMs: winnerIds.has(p.id)
        ? (winnerTimeById.get(p.id) ?? winnerMax)
        : Math.floor(otherMin + Math.random() * (otherMax - otherMin)),
    }));

    // 设定确定的完赛顺序（按目标时间升序），让“中奖者=冠军”逻辑一致
    const byTime = [...initialHorses].sort((a, b) => a.targetTimeMs - b.targetTimeMs);
    const orderById = new Map<number, number>();
    byTime.forEach((h, idx) => orderById.set(h.id, idx + 1));
    initialHorses = initialHorses.map(h => ({ ...h, finishOrder: orderById.get(h.id) ?? 0 }));

    setHorses(initialHorses);
    setRaceFinished(false);
    setWinners([]);
    setOverlayOpen(true);
    setPhase('drawing');

    const startAt = performance.now();
    const interval = window.setInterval(() => {
      if (runId !== runIdRef.current) return;
      const elapsed = performance.now() - startAt;
      const trackEnd = 92;
      setHorses(prev =>
        prev.map(h => {
          const raw = Math.min(100, (elapsed / Math.max(1, h.targetTimeMs)) * 100);
          const pos = Math.min(trackEnd, (raw / 100) * trackEnd);
          return {
            ...h,
            position: pos,
            finished: raw >= 100,
          };
        }),
      );
    }, 40);

    const revealTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setPhase('revealing');
    }, Math.max(700, Math.floor(durationMs * 0.74)));

    const doneTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      window.clearInterval(interval);
      setHorses(prev => prev.map(h => ({ ...h, position: 92, finished: true })));
      setRaceFinished(true);
      setWinners(winnersRef.current);
      setPhase('done');
      onComplete(winnersRef.current);
    }, durationMs);

    const closeTimer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setOverlayOpen(false);
    }, durationMs + 2800);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  const sortedHorses = [...horses].sort((a, b) => a.finishOrder - b.finishOrder);

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="赛马抽奖"
        subtitle={phase === 'drawing' ? '比赛进行中…' : phase === 'revealing' ? '冲刺中…' : '结果已生成'}
        winners={winners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4 w-full">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide mb-8">🏇 赛马抽奖 🏇</h2>

          {/* 赛道（带透视） */}
          <div className="w-full max-w-5xl" style={{ perspective: '1200px' }}>
            <div
              className="w-full rounded-2xl p-5 relative overflow-hidden"
              style={{
                transform: 'rotateX(12deg)',
                background:
                  'linear-gradient(180deg, rgba(22,163,74,0.55), rgba(3,7,18,0.55))',
                boxShadow:
                  '0 50px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset',
              }}
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    'radial-gradient(800px 220px at 30% 20%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(700px 240px at 80% 30%, rgba(168,85,247,0.16), transparent 55%)',
                }}
              />

              {/* 终点线 */}
              <div
                className="absolute right-8 top-4 bottom-4 w-2 rounded"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(15,23,42,1), rgba(15,23,42,1) 10px, rgba(255,255,255,0.9) 10px, rgba(255,255,255,0.9) 20px)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset',
                }}
              />

              {horses.map((horse, i) => (
                <div key={horse.id} className="relative h-12 mb-2 last:mb-0">
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(15,23,42,0.35), rgba(15,23,42,0.12))',
                    }}
                  />
                  <motion.div
                    className="absolute flex items-center gap-2 z-10"
                    style={{ left: `${horse.position}%` }}
                    animate={{ left: `${horse.position}%` }}
                    transition={{ duration: 0.04 }}
                  >
                    <div
                      className="h-9 w-9 rounded-2xl flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/15"
                      style={{
                        backgroundColor: horse.color,
                        boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <span className="text-white text-sm font-medium bg-black/45 px-2 py-1 rounded-lg truncate max-w-28 ring-1 ring-white/10">
                      {horse.name}
                    </span>
                    {horse.finished && (
                      <span className="text-xs text-white/75 bg-white/10 px-2 py-1 rounded-lg ring-1 ring-white/10">
                        #{horse.finishOrder}
                      </span>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {raceFinished && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 w-full max-w-5xl"
            >
              <h3 className="text-lg font-semibold text-center text-white mb-4">🏆 比赛结果 🏆</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sortedHorses.slice(0, Math.min(winnerCount, sortedHorses.length)).map((horse, idx) => (
                  <div
                    key={horse.id}
                    className={`p-4 rounded-2xl text-center ring-1 ring-white/15 ${
                      idx === 0 ? 'bg-yellow-400/90 text-black' : idx === 1 ? 'bg-slate-200/90 text-black' : idx === 2 ? 'bg-orange-400/90 text-black' : 'bg-white/8 text-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</div>
                    <p className="font-semibold">{horse.name}</p>
                    <p className="text-sm opacity-80">第 {idx + 1} 名</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </CinematicStage>

      <div className="flex flex-col items-center justify-center min-h-[500px] w-full">
        {winners.length > 0 ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">🏆 比赛结果 🏆</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {winners.map(w => (
                <div key={w.id} className="bg-gradient-to-r from-emerald-500 to-lime-500 text-white px-6 py-3 rounded-lg shadow-lg">
                  <p className="font-bold">{w.name}</p>
                  <p className="text-sm opacity-90">{w.department}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-slate-500">点击开始抽奖按钮开始比赛（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
