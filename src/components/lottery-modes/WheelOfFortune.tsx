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

export function WheelOfFortune({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [rotation, setRotation] = useState(0);
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);
  const winnersRef = useRef<Participant[]>([]);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<CinematicPhase>('idle');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [displayParticipants, setDisplayParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    // 随机选择中奖者
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winnersRef.current = shuffled.slice(0, Math.min(winnerCount, participants.length));

    // 构造展示用的扇区（保证转盘完整可用，并尽量包含中奖者）
    const minSegments = 6;
    const maxSegments = 12;
    const segmentCount = Math.min(maxSegments, Math.max(minSegments, participants.length));

    const picked = new Map<number, Participant>();
    winnersRef.current.forEach(p => picked.set(p.id, p));

    const rest = [...participants].filter(p => !picked.has(p.id)).sort(() => Math.random() - 0.5);
    for (const p of rest) {
      if (picked.size >= Math.min(segmentCount, participants.length)) break;
      picked.set(p.id, p);
    }

    const base = Array.from(picked.values()).sort(() => Math.random() - 0.5);
    const display: Participant[] = [];
    while (display.length < segmentCount) {
      display.push(base[display.length % base.length]);
      if (base.length === 0) break;
    }
    // 计算旋转
    const spins = 5 + Math.random() * 3;
    const targetRotation = spins * 360 + Math.random() * 360;

    const raf = requestAnimationFrame(() => {
      if (runId !== runIdRef.current) return;
      setDisplayParticipants(display);
      setOverlayOpen(true);
      setPhase('drawing');
      setRotation(targetRotation);
      setCurrentWinners([]);
    });

    const revealTimer = setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setPhase('revealing');
    }, Math.max(600, Math.floor(durationMs * 0.72)));

    const doneTimer = setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setCurrentWinners(winnersRef.current);
      setPhase('done');
      onComplete(winnersRef.current);
    }, durationMs);

    const closeTimer = setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setOverlayOpen(false);
    }, durationMs + 2800);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
      clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  const segmentAngle = 360 / Math.max(displayParticipants.length, 1);
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="转盘抽奖"
        subtitle={phase === 'drawing' ? '高速旋转中…' : phase === 'revealing' ? '正在锁定中奖者…' : '结果已生成'}
        winners={currentWinners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative" style={{ perspective: '1100px' }}>
            {/* 指针 */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-rose-500 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]" />
            </div>

            {/* 3D 转盘 */}
            <motion.div
              className="relative rounded-full overflow-hidden"
              animate={{ rotate: rotation }}
              transition={{ duration: durationMs / 1000, ease: [0.12, 0.72, 0.12, 0.98] }}
              style={{
                width: 'min(70vw, 520px)',
                height: 'min(70vw, 520px)',
                transformStyle: 'preserve-3d',
                rotateX: 18,
                boxShadow:
                  '0 50px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 80px rgba(59,130,246,0.12)',
              }}
            >
              {/* 扇区 */}
              {displayParticipants.map((p, i) => (
                <div
                  key={`${p.id}_${i}`}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${i * segmentAngle}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle * Math.PI) / 360)}% 0%)`,
                    backgroundColor: colors[i % colors.length],
                  }}
                >
                  <div
                    className="absolute text-[11px] font-semibold text-white/95 truncate"
                    style={{
                      top: '18%',
                      left: '50%',
                      transform: `translateX(-50%) rotate(${segmentAngle / 2}deg) translateZ(40px)`,
                      maxWidth: '86px',
                      textShadow: '0 4px 10px rgba(0,0,0,0.45)',
                    }}
                  >
                    {p.name}
                  </div>
                </div>
              ))}

              {/* 高光 */}
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.14), transparent 60%)',
                  mixBlendMode: 'screen',
                }}
              />

              {/* 中心徽章 */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
                style={{
                  width: '84px',
                  height: '84px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.80))',
                  boxShadow:
                    '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06) inset',
                }}
              >
                <div className="text-2xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]">🎯</div>
              </div>
            </motion.div>

            {/* 底部阴影 */}
            <div
              className="pointer-events-none absolute left-1/2 top-[calc(100%+14px)] h-10 w-[80%] -translate-x-1/2 rounded-full opacity-60 blur-xl"
              style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.65), transparent 68%)' }}
            />
          </div>

          <div className="mt-6 text-center">
            {phase === 'drawing' && <div className="text-sm text-white/70">正在旋转，准备揭晓…</div>}
            {phase === 'revealing' && <div className="text-sm text-white/70">锁定目标中…</div>}
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
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg"
                >
                  <p className="font-bold text-lg">{w.name}</p>
                  <p className="text-sm opacity-90">{w.department}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-slate-500">点击开始抽奖按钮启动转盘（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
