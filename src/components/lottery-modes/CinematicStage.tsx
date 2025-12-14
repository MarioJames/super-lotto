'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Participant } from '@/lib/types';

export type CinematicPhase = 'idle' | 'drawing' | 'revealing' | 'done';

interface CinematicStageProps {
  open: boolean;
  phase: CinematicPhase;
  title: string;
  subtitle?: string;
  hint?: string;
  winners?: Participant[];
  canClose?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

type ConfettiPiece = {
  id: string;
  x: number;
  size: number;
  rotate: number;
  delay: number;
  duration: number;
  color: string;
};

const CONFETTI_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#22d3ee',
  '#fb7185',
  '#f97316',
];

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function CinematicStage({
  open,
  phase,
  title,
  subtitle,
  hint = '按 Esc 退出全屏展示',
  winners,
  canClose = false,
  onClose,
  children,
}: CinematicStageProps) {
  const reduceMotion = useReducedMotion();
  const seed = useMemo(() => hashString(title), [title]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, canClose, onClose]);

  const particles = useMemo(() => {
    const rand = mulberry32(seed ^ 0x2c1b3c6d);
    const count = 48;
    return Array.from({ length: count }).map((_, i) => {
      const size = 2 + rand() * 5;
      return {
        id: `p_${i}_${Math.floor(rand() * 1_000_000).toString(16)}`,
        size,
        x: rand() * 100,
        y: rand() * 100,
        opacity: 0.15 + rand() * 0.35,
        blur: 0.5 + rand() * 2.5,
        duration: 8 + rand() * 14,
        delay: rand() * 3,
        driftX: (rand() - 0.5) * 40,
        driftY: (rand() - 0.5) * 40,
      };
    });
  }, [seed]);

  const confetti = useMemo<ConfettiPiece[]>(() => {
    const rand = mulberry32(seed ^ 0xa4d3b2f1);
    const count = 80;
    return Array.from({ length: count }).map((_, i) => ({
      id: `c_${i}_${Math.floor(rand() * 1_000_000).toString(16)}`,
      x: rand() * 100,
      size: 6 + rand() * 10,
      rotate: rand() * 360,
      delay: rand() * 0.35,
      duration: 1.8 + rand() * 1.4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
  }, [seed]);

  const showConfetti = phase === 'done' && (winners?.length ?? 0) > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          aria-modal="true"
          role="dialog"
        >
          {/* 背景：深色渐变 + 光晕 */}
          <div className="absolute inset-0 bg-slate-950">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  'radial-gradient(1200px 600px at 20% 20%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(900px 540px at 80% 30%, rgba(168,85,247,0.28), transparent 55%), radial-gradient(900px 520px at 40% 85%, rgba(34,211,238,0.22), transparent 60%)',
              }}
            />
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.10), rgba(255,255,255,0) 30%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0) 80%)',
              }}
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* 粒子 */}
          <div className="absolute inset-0">
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                  filter: `blur(${p.blur}px)`,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.1) 70%, transparent 75%)',
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        x: [0, p.driftX, 0],
                        y: [0, p.driftY, 0],
                        opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.35],
                      }
                }
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* 3D 网格地面 */}
          <div className="absolute inset-0" style={{ perspective: '1200px' }}>
            <motion.div
              className="absolute left-1/2 top-[58%] h-[120vh] w-[140vw] -translate-x-1/2 -translate-y-1/2"
              style={{
                transformStyle: 'preserve-3d',
                rotateX: 74,
                rotateZ: 12,
                backgroundImage:
                  'linear-gradient(rgba(59,130,246,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.18) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(closest-side, rgba(0,0,0,0.95), transparent 78%)',
                opacity: 0.55,
              }}
              animate={reduceMotion ? undefined : { rotateZ: [12, 18, 12] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* 扫描光带 */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0 h-[2px] w-full opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              filter: 'blur(0.2px)',
            }}
            animate={reduceMotion ? undefined : { y: ['8%', '92%', '8%'] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* 顶部信息栏 */}
          <div className="relative z-10 flex h-full w-full flex-col">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/8 ring-1 ring-white/15 backdrop-blur flex items-center justify-center">
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold tracking-wide text-white">{title}</div>
                    {subtitle && <div className="truncate text-sm text-white/70">{subtitle}</div>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-xs text-white/55">{hint}</div>
                <button
                  type="button"
                  onClick={() => canClose && onClose?.()}
                  disabled={!canClose}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/15 bg-white/5 backdrop-blur hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
                >
                  退出
                </button>
              </div>
            </div>

            {/* 主舞台 */}
            <div className="relative flex-1">
              <div className="absolute inset-0 flex items-center justify-center px-6 pb-14">
                <div className="relative w-full max-w-6xl">
                  {/* 中心能量环 */}
                  <motion.div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[min(62vw,520px)] w-[min(62vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(circle at 50% 50%, rgba(34,211,238,0.12), transparent 62%), radial-gradient(circle at 30% 30%, rgba(168,85,247,0.16), transparent 58%)',
                      filter: 'drop-shadow(0 0 24px rgba(59,130,246,0.25))',
                    }}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            rotate: 360,
                            scale: phase === 'revealing' ? [1, 1.04, 1] : 1,
                          }
                    }
                    transition={{
                      rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 0.8, ease: 'easeOut' },
                    }}
                  />

                  {/* 内容区（模式动画） */}
                  <div className="relative">
                    <div
                      className="mx-auto w-full max-w-4xl rounded-3xl ring-1 ring-white/15 bg-white/5 backdrop-blur-xl"
                      style={{
                        boxShadow:
                          '0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 80px rgba(59,130,246,0.10)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div className="p-6 sm:p-8">{children}</div>
                    </div>
                  </div>

                  {/* 结果展示 */}
                  {(winners?.length ?? 0) > 0 && phase === 'done' && (
                    <motion.div
                      className="mt-8"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
                    >
                      <div className="flex items-end justify-between gap-4 px-1">
                        <div className="min-w-0">
                          <div className="text-2xl font-semibold text-white tracking-wide">恭喜中奖</div>
                          <div className="text-sm text-white/65">结果已生成，可导出或进入下一轮</div>
                        </div>
                        <div className="text-xs text-white/55">中奖人数：{winners?.length ?? 0}</div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {winners?.map((w, idx) => (
                          <motion.div
                            key={w.id}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/15"
                            style={{
                              transformStyle: 'preserve-3d',
                              boxShadow:
                                '0 18px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
                            }}
                            initial={{ opacity: 0, y: 18, rotateX: -18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                            transition={{
                              delay: reduceMotion ? 0 : Math.min(0.35, idx * 0.06),
                              type: 'spring',
                              stiffness: 240,
                              damping: 22,
                            }}
                          >
                            <div
                              className="absolute inset-0 opacity-60"
                              style={{
                                backgroundImage:
                                  'radial-gradient(600px 240px at 20% 15%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(520px 260px at 80% 20%, rgba(168,85,247,0.18), transparent 55%)',
                              }}
                            />
                            <motion.div
                              className="absolute inset-0 opacity-50"
                              style={{
                                backgroundImage:
                                  'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.14) 35%, transparent 55%)',
                                transform: 'translateX(-60%)',
                              }}
                              animate={reduceMotion ? undefined : { x: ['-60%', '140%'] }}
                              transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <div className="relative p-5 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                                <span className="text-lg font-semibold text-white">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-lg font-semibold text-white">{w.name}</div>
                                <div className="truncate text-sm text-white/65">{w.department || '—'}</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 text-center text-xs text-white/45">
              {phase === 'drawing' ? '抽奖中：沉浸式 3D 全屏展示' : phase === 'revealing' ? '揭晓中：正在点亮中奖者' : ' '}
            </div>
          </div>

          {/* 彩带 */}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confetti.map(piece => (
                <motion.span
                  key={piece.id}
                  className="absolute top-[-10%] rounded-sm"
                  style={{
                    left: `${piece.x}%`,
                    width: piece.size * 0.66,
                    height: piece.size,
                    backgroundColor: piece.color,
                    boxShadow: '0 0 12px rgba(255,255,255,0.08)',
                  }}
                  initial={{ y: 0, rotate: piece.rotate, opacity: 0 }}
                  animate={
                    reduceMotion
                      ? { opacity: 0.9 }
                      : {
                          y: ['0%', '120%'],
                          rotate: [piece.rotate, piece.rotate + 420],
                          opacity: [0, 1, 1, 0],
                        }
                  }
                  transition={{ delay: piece.delay, duration: piece.duration, ease: 'easeIn' }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
