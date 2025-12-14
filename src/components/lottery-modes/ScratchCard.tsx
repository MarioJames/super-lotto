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

export function ScratchCard({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const [cards, setCards] = useState<{ id: number; name: string; department: string; revealed: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const winnersRef = useRef<Participant[]>([]);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<CinematicPhase>('idle');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);

  useEffect(() => {
    if (!isRunning || participants.length === 0) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

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
    setCurrentWinners([]);
    setOverlayOpen(true);
    setPhase('drawing');

    const intervalTime = durationMs / (winnersRef.current.length + 1);
    let idx = 0;
    const revealTimers: number[] = [];

    const interval = setInterval(() => {
      if (idx < winnersRef.current.length) {
        setCurrentIndex(idx);
        setPhase('revealing');
        const t = window.setTimeout(() => {
          if (runId !== runIdRef.current) return;
          setCards(prev => prev.map((c, i) => i === idx ? { ...c, revealed: true } : c));
        }, Math.min(700, Math.max(120, intervalTime * 0.55)));
        revealTimers.push(t);
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
      revealTimers.forEach(t => window.clearTimeout(t));
      window.clearTimeout(closeTimer);
    };
  }, [isRunning, participants, winnerCount, durationMs, onComplete]);

  return (
    <>
      <CinematicStage
        open={overlayOpen}
        phase={phase}
        title="刮刮乐抽奖"
        subtitle={phase === 'drawing' ? '刮奖中…' : phase === 'revealing' ? '正在揭晓…' : '结果已生成'}
        winners={currentWinners}
        canClose={phase === 'done'}
        onClose={() => setOverlayOpen(false)}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide mb-8">🎫 刮刮乐抽奖 🎫</h2>

          <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
            {cards.map((card, i) => (
              <div key={card.id} className="relative" style={{ perspective: '1000px' }}>
                {/* 底层 - 中奖信息 */}
                <div
                  className="w-44 h-52 rounded-2xl p-4 flex flex-col items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, rgba(253,224,71,0.95), rgba(245,158,11,0.92))',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.18) inset',
                    transform: 'rotateX(8deg)',
                  }}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-bold text-lg text-center text-black/80">{card.name}</p>
                  <p className="text-sm text-black/60">{card.department}</p>
                  <div className="mt-2 text-2xl">🏆</div>
                </div>

                {/* 刮刮层 */}
                <motion.div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden ring-1 ring-white/15"
                  style={{
                    background: 'linear-gradient(145deg, rgba(148,163,184,0.9), rgba(51,65,85,0.9))',
                    transform: 'translateZ(26px)',
                    boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
                  }}
                  initial={{ opacity: 1 }}
                  animate={{
                    opacity: card.revealed ? 0 : 1,
                    scale: card.revealed ? 1.08 : 1,
                    rotateX: card.revealed ? -10 : 0,
                  }}
                  transition={{ duration: 0.55 }}
                >
                  {currentIndex === i && !card.revealed ? (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.22) 35%, transparent 55%)',
                      }}
                      animate={{ x: ['-60%', '140%'] }}
                      transition={{ duration: 0.85, repeat: Infinity }}
                    />
                  ) : null}
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">刮开有奖</p>
                    <p className="text-white/70 text-sm">第 {i + 1} 张</p>
                  </div>
                  {currentIndex === i && !card.revealed && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.10) 10px, rgba(255,255,255,0.10) 20px)',
                      }}
                      animate={{ opacity: [0.2, 0.9, 0.2] }}
                      transition={{ duration: 0.35, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          {cards.length > 0 && cards.every(c => c.revealed) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-xl sm:text-2xl font-semibold text-white"
            >
              🎊 全部刮开！恭喜以上中奖者！🎊
            </motion.p>
          )}
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
          <p className="text-slate-500">点击开始抽奖按钮开始刮奖（将以全屏 3D 形式展示）</p>
        )}
      </div>
    </>
  );
}
