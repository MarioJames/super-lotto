'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Participant } from '@/lib/types';
import { CinematicStage, type CinematicPhase } from './CinematicStage';
import { DoubleBall3DMachine } from './DoubleBall3DMachine';

interface Props {
  participants: Participant[];
  winnerCount: number;
  durationMs: number;
  onComplete: (winners: Participant[]) => void;
  isRunning: boolean;
}

const RED_BALL = '#ef4444';
const BLUE_BALL = '#3b82f6';

export function DoubleBallLottery({ participants, winnerCount, durationMs, onComplete, isRunning }: Props) {
  const actualWinnerCount = Math.min(winnerCount, participants.length, 49);
  const [balls, setBalls] = useState<{ id: number; name: string; color: string; ballNo: number; revealed: boolean }[]>([]);
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

    const fisherYatesShuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const maxWinners = Math.min(winnerCount, participants.length, 49);
    const shuffledParticipants = fisherYatesShuffle([...participants]);
    winnersRef.current = shuffledParticipants.slice(0, maxWinners);

    const ballPool = fisherYatesShuffle([
      ...Array.from({ length: 33 }, (_, i) => ({ color: RED_BALL, ballNo: i + 1 })),
      ...Array.from({ length: 16 }, (_, i) => ({ color: BLUE_BALL, ballNo: i + 1 })),
    ]);

    const initialBalls = winnersRef.current.map((p, i) => {
      return {
        id: p.id,
        name: p.name,
        color: ballPool[i].color,
        ballNo: ballPool[i].ballNo,
        revealed: false,
      };
    });
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
            <p className="text-white/70 text-sm mt-1">共 {actualWinnerCount} 个中奖名额</p>
          </div>

          {/* 真实 3D 摇奖机（Three.js 程序建模） */}
          <DoubleBall3DMachine
            phase={phase}
            balls={balls}
            activeIndex={currentIndex}
            className="w-full rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/20"
          />

          {/* 开出的球 */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-3xl">
            {balls.map(ball => (
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
                  {ball.ballNo}
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
