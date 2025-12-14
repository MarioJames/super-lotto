'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LotteryMode, Participant } from '@/lib/types';
import {
  generateMockParticipants,
  selectRandomMode,
} from '@/lib/demo/mock-generator';
import {
  WheelOfFortune,
  DoubleBallLottery,
  SlotMachine,
  HorseRace,
  ScratchCard,
  ZumaLottery,
} from '@/components/lottery-modes';

// Demo animation duration (5 seconds as per requirements)
const DEMO_ANIMATION_DURATION_MS = 5000;

// Lottery mode display names
const LOTTERY_MODE_NAMES: Record<LotteryMode, string> = {
  [LotteryMode.DOUBLE_BALL]: '双色球',
  [LotteryMode.SCRATCH]: '刮刮乐',
  [LotteryMode.ZUMA]: '祖玛',
  [LotteryMode.HORSE_RACE]: '赛马',
  [LotteryMode.WHEEL]: '转盘',
  [LotteryMode.SLOT_MACHINE]: '老虎机',
};

interface DemoLotteryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DemoStatus = 'idle' | 'running' | 'completed';

interface DemoState {
  status: DemoStatus;
  participants: Participant[];
  selectedMode: LotteryMode;
  winnerCount: number;
  winners: Participant[];
  previousModes: LotteryMode[];
}

export function DemoLotteryModal({ isOpen, onClose }: DemoLotteryModalProps) {
  const [state, setState] = useState<DemoState>({
    status: 'idle',
    participants: [],
    selectedMode: LotteryMode.WHEEL,
    winnerCount: 1,
    winners: [],
    previousModes: [],
  });
  const startTimerRef = useRef<number | null>(null);

  // Initialize demo with fresh data
  const initializeDemo = useCallback(() => {
    const participants = generateMockParticipants();
    const winnerCount = Math.floor(Math.random() * 3) + 1; // 1-3 winners

    setState(prev => {
      const selectedMode = selectRandomMode(prev.previousModes);
      return {
        ...prev,
        status: 'idle',
        participants,
        selectedMode,
        winnerCount,
        winners: [],
      };
    });

    if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
    startTimerRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, status: 'running' }));
    }, 500);
  }, []);

  // Initialize demo when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => initializeDemo());
    return () => {
      cancelAnimationFrame(raf);
      if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    };
  }, [isOpen, initializeDemo]);

  // Handle lottery completion
  const handleComplete = useCallback((winners: Participant[]) => {
    setState(prev => ({
      ...prev,
      status: 'completed',
      winners,
      previousModes: [...prev.previousModes, prev.selectedMode],
    }));
  }, []);

  // Try another mode
  const handleTryAnotherMode = useCallback(() => {
    initializeDemo();
  }, [initializeDemo]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
    setState({
      status: 'idle',
      participants: [],
      selectedMode: LotteryMode.WHEEL,
      winnerCount: 1,
      winners: [],
      previousModes: [],
    });
    onClose();
  }, [onClose]);

  // Render the appropriate lottery mode component
  const renderLotteryMode = () => {
    const commonProps = {
      participants: state.participants,
      winnerCount: state.winnerCount,
      durationMs: DEMO_ANIMATION_DURATION_MS,
      onComplete: handleComplete,
      isRunning: state.status === 'running',
    };

    switch (state.selectedMode) {
      case LotteryMode.WHEEL:
        return <WheelOfFortune {...commonProps} />;
      case LotteryMode.DOUBLE_BALL:
        return <DoubleBallLottery {...commonProps} />;
      case LotteryMode.SLOT_MACHINE:
        return <SlotMachine {...commonProps} />;
      case LotteryMode.HORSE_RACE:
        return <HorseRace {...commonProps} />;
      case LotteryMode.SCRATCH:
        return <ScratchCard {...commonProps} />;
      case LotteryMode.ZUMA:
        return <ZumaLottery {...commonProps} />;
      default:
        return <WheelOfFortune {...commonProps} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎰 演示模式 - {LOTTERY_MODE_NAMES[state.selectedMode]}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Lottery animation area */}
          <div className="min-h-[500px] flex items-center justify-center">
            {state.participants.length > 0 && renderLotteryMode()}
          </div>

          {/* Result and retry section */}
          {state.status === 'completed' && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-slate-500 mb-2">
                  本次演示共 {state.participants.length} 人参与，
                  抽出 {state.winners.length} 位幸运儿
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleTryAnotherMode}
                  variant="default"
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  🔄 换个模式
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="lg"
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
