'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2, Play, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityWithRounds, Participant, Round } from '@/lib/types';
import { LotteryMode } from '@/lib/types';
import { RoundInfoBar, ActionPanel, WinnerResultsDisplay, CompletionDisplay } from '@/components/lottery';
import {
  WheelOfFortune,
  DoubleBallLottery,
  SlotMachine,
  HorseRace,
  ScratchCard,
  ZumaLottery,
} from '@/components/lottery-modes';

// 页面状态类型
type LotteryPhase = 'loading' | 'ready' | 'drawing' | 'results' | 'completed' | 'error' | 'insufficient';

// 错误类型
type ErrorType = 'network' | 'not_found' | 'insufficient_participants' | 'unknown';

// 页面状态接口
interface PageState {
  phase: LotteryPhase;
  activity: ActivityWithRounds | null;
  currentRoundIndex: number;
  availableParticipants: Participant[];
  currentWinners: Participant[];
  error: string | null;
  errorType: ErrorType | null;
  isDrawing: boolean;
  isRedrawing: boolean;
  isExporting: boolean;
}

/**
 * 找到第一个未抽奖的轮次索引
 * Property 1: First Undrawn Round Identification
 */
export function findFirstUndrawnRoundIndex(rounds: Round[]): number {
  const index = rounds.findIndex((r) => !r.isDrawn);
  return index >= 0 ? index : -1; // -1 表示所有轮次都已完成
}

/**
 * 检查参与人数是否足够
 * Property 11: Insufficient Participants Error
 * 对于任何轮次，如果可用参与人数少于所需中奖人数，系统应显示错误信息并阻止抽奖
 * Requirements: 6.1
 */
export function checkInsufficientParticipants(
  availableCount: number,
  requiredCount: number
): { isInsufficient: boolean; shortage: number } {
  const shortage = requiredCount - availableCount;
  return {
    isInsufficient: shortage > 0,
    shortage: Math.max(0, shortage),
  };
}


export default function ImmersiveLotteryPage({
  params
}: {
  params: Promise<{ activityId: string }>
}) {
  const { activityId } = use(params);
  const router = useRouter();

  const [state, setState] = useState<PageState>({
    phase: 'loading',
    activity: null,
    currentRoundIndex: 0,
    availableParticipants: [],
    currentWinners: [],
    error: null,
    errorType: null,
    isDrawing: false,
    isRedrawing: false,
    isExporting: false,
  });

  // 获取活动数据
  const fetchActivity = async (): Promise<ActivityWithRounds | null> => {
    try {
      const res = await fetch(`/api/activities/${activityId}`);

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: '获取活动数据失败，请检查网络连接',
          errorType: 'network',
        }));
        return null;
      }

      const data = await res.json();

      if (!data.success || !data.data) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: '活动不存在或已被删除',
          errorType: 'not_found',
        }));
        return null;
      }

      return data.data as ActivityWithRounds;
    } catch {
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: '获取活动数据失败，请检查网络连接',
        errorType: 'network',
      }));
      return null;
    }
  };

  // 获取可用参与人员
  const fetchAvailableParticipants = async (): Promise<{ participants: Participant[]; error: boolean }> => {
    try {
      const res = await fetch(`/api/lottery/available/${activityId}`);

      if (!res.ok) {
        return { participants: [], error: true };
      }

      const data = await res.json();
      if (data.success) {
        return { participants: data.data as Participant[], error: false };
      }
      return { participants: [], error: false };
    } catch {
      console.error('获取可用参与人员失败');
      return { participants: [], error: true };
    }
  };


  // 初始化加载
  useEffect(() => {
    const initPage = async () => {
      setState(prev => ({ ...prev, phase: 'loading', error: null, errorType: null }));

      const activity = await fetchActivity();
      if (!activity) return;

      const { participants, error: participantsError } = await fetchAvailableParticipants();

      if (participantsError) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: '获取参与人员数据失败，请检查网络连接',
          errorType: 'network',
        }));
        return;
      }

      // 找到第一个未抽奖的轮次
      const firstUndrawnIndex = findFirstUndrawnRoundIndex(activity.rounds);

      // 判断是否所有轮次都已完成
      if (firstUndrawnIndex === -1) {
        setState({
          phase: 'completed',
          activity,
          currentRoundIndex: activity.rounds.length - 1,
          availableParticipants: participants,
          currentWinners: [],
          error: null,
          errorType: null,
          isDrawing: false,
          isRedrawing: false,
          isExporting: false,
        });
        return;
      }

      // 检查参与人数是否足够
      const currentRound = activity.rounds[firstUndrawnIndex];
      const { isInsufficient, shortage } = checkInsufficientParticipants(
        participants.length,
        currentRound.winnerCount
      );

      if (isInsufficient) {
        setState({
          phase: 'insufficient',
          activity,
          currentRoundIndex: firstUndrawnIndex,
          availableParticipants: participants,
          currentWinners: [],
          error: `可用参与人数不足：当前轮次需要 ${currentRound.winnerCount} 人，但仅有 ${participants.length} 人可用，还差 ${shortage} 人`,
          errorType: 'insufficient_participants',
          isDrawing: false,
          isRedrawing: false,
          isExporting: false,
        });
        return;
      }

      setState({
        phase: 'ready',
        activity,
        currentRoundIndex: firstUndrawnIndex,
        availableParticipants: participants,
        currentWinners: [],
        error: null,
        errorType: null,
        isDrawing: false,
        isRedrawing: false,
        isExporting: false,
      });
    };

    initPage();
  }, [activityId]);

  // 返回主应用
  const handleBack = () => {
    router.push('/activities');
  };


  // 重试加载
  const handleRetry = () => {
    setState(prev => ({ ...prev, phase: 'loading', error: null, errorType: null }));
    const initPage = async () => {
      const activity = await fetchActivity();
      if (!activity) return;

      const { participants, error: participantsError } = await fetchAvailableParticipants();

      if (participantsError) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: '获取参与人员数据失败，请检查网络连接',
          errorType: 'network',
        }));
        return;
      }

      const firstUndrawnIndex = findFirstUndrawnRoundIndex(activity.rounds);

      if (firstUndrawnIndex === -1) {
        setState({
          phase: 'completed',
          activity,
          currentRoundIndex: activity.rounds.length - 1,
          availableParticipants: participants,
          currentWinners: [],
          error: null,
          errorType: null,
          isDrawing: false,
          isRedrawing: false,
          isExporting: false,
        });
        return;
      }

      // 检查参与人数是否足够
      const currentRound = activity.rounds[firstUndrawnIndex];
      const { isInsufficient, shortage } = checkInsufficientParticipants(
        participants.length,
        currentRound.winnerCount
      );

      if (isInsufficient) {
        setState({
          phase: 'insufficient',
          activity,
          currentRoundIndex: firstUndrawnIndex,
          availableParticipants: participants,
          currentWinners: [],
          error: `可用参与人数不足：当前轮次需要 ${currentRound.winnerCount} 人，但仅有 ${participants.length} 人可用，还差 ${shortage} 人`,
          errorType: 'insufficient_participants',
          isDrawing: false,
          isRedrawing: false,
          isExporting: false,
        });
        return;
      }

      setState({
        phase: 'ready',
        activity,
        currentRoundIndex: firstUndrawnIndex,
        availableParticipants: participants,
        currentWinners: [],
        error: null,
        errorType: null,
        isDrawing: false,
        isRedrawing: false,
        isExporting: false,
      });
    };
    initPage();
  };

  const currentRound = state.activity?.rounds[state.currentRoundIndex];


  // 开始抽奖
  const handleStartDraw = useCallback(() => {
    if (!currentRound || state.isDrawing) return;

    // 检查可用人数是否足够
    if (state.availableParticipants.length < currentRound.winnerCount) {
      toast.error(`可用人数不足：需要 ${currentRound.winnerCount} 人，当前仅有 ${state.availableParticipants.length} 人`);
      return;
    }

    setState(prev => ({ ...prev, isDrawing: true, phase: 'drawing' }));
  }, [currentRound, state.isDrawing, state.availableParticipants.length]);

  // 抽奖完成回调
  const handleDrawComplete = useCallback(async (winners: Participant[]) => {
    if (!currentRound || !state.activity) return;

    try {
      // 调用 API 保存中奖结果
      const res = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: currentRound.id,
          winnerIds: winners.map(w => w.id),
        }),
      });

      if (!res.ok) {
        toast.error('网络错误，保存中奖结果失败，请重试');
        setState(prev => ({ ...prev, isDrawing: false, phase: 'ready' }));
        return;
      }

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || '保存中奖结果失败');
        setState(prev => ({ ...prev, isDrawing: false, phase: 'ready' }));
        return;
      }

      // 更新状态
      setState(prev => ({
        ...prev,
        isDrawing: false,
        phase: 'results',
        currentWinners: winners,
        // 更新轮次状态
        activity: prev.activity ? {
          ...prev.activity,
          rounds: prev.activity.rounds.map(r =>
            r.id === currentRound.id ? { ...r, isDrawn: true } : r
          ),
        } : null,
      }));

      toast.success(`恭喜 ${winners.length} 位中奖者！`);
    } catch {
      toast.error('网络错误，保存中奖结果失败，请重试');
      setState(prev => ({ ...prev, isDrawing: false, phase: 'ready' }));
    }
  }, [currentRound, state.activity]);


  /**
   * 进入下一轮
   * Property 6: Next Round Navigation
   * 对于有多个轮次的活动，点击"下一轮"应跳转到下一个未抽奖的轮次
   * Requirements: 3.2
   */
  const handleNextRound = useCallback(async () => {
    if (!state.activity) return;

    // 找到下一个未抽奖的轮次
    const nextUndrawnIndex = state.activity.rounds.findIndex(
      (r, idx) => idx > state.currentRoundIndex && !r.isDrawn
    );

    if (nextUndrawnIndex === -1) {
      // 没有更多未抽奖的轮次
      setState(prev => ({ ...prev, phase: 'completed' }));
      return;
    }

    // 刷新可用参与人员
    const { participants, error: participantsError } = await fetchAvailableParticipants();

    if (participantsError) {
      toast.error('获取参与人员数据失败，请重试');
      return;
    }

    // 检查参与人数是否足够
    const nextRound = state.activity.rounds[nextUndrawnIndex];
    const { isInsufficient, shortage } = checkInsufficientParticipants(
      participants.length,
      nextRound.winnerCount
    );

    if (isInsufficient) {
      setState(prev => ({
        ...prev,
        currentRoundIndex: nextUndrawnIndex,
        availableParticipants: participants,
        currentWinners: [],
        phase: 'insufficient',
        error: `可用参与人数不足：当前轮次需要 ${nextRound.winnerCount} 人，但仅有 ${participants.length} 人可用，还差 ${shortage} 人`,
        errorType: 'insufficient_participants',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentRoundIndex: nextUndrawnIndex,
      availableParticipants: participants,
      currentWinners: [],
      phase: 'ready',
      error: null,
      errorType: null,
    }));
  }, [state.activity, state.currentRoundIndex]);

  /**
   * 导出当前轮次中奖名单
   * Requirements: 3.3
   */
  const handleExport = useCallback(async () => {
    if (!currentRound) return;

    setState(prev => ({ ...prev, isExporting: true }));

    try {
      const res = await fetch(`/api/export/round/${currentRound.id}`);

      if (!res.ok) {
        toast.error('网络错误，导出失败，请重试');
        setState(prev => ({ ...prev, isExporting: false }));
        return;
      }

      // 获取文件内容并触发下载
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `round_${currentRound.id}_winners.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('导出成功');
    } catch {
      toast.error('网络错误，导出失败，请重试');
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [currentRound]);


  /**
   * 重新抽取当前轮次
   * Property 8: Redraw State Reset
   * 对于已抽奖的轮次，重新抽取应删除所有中奖记录并重置轮次状态
   * Requirements: 3.4, 4.1, 4.2
   */
  const handleRedraw = useCallback(async () => {
    if (!currentRound || !state.activity) return;

    setState(prev => ({ ...prev, isRedrawing: true }));

    try {
      // 调用 API 清除中奖记录
      const res = await fetch(`/api/lottery/results/${currentRound.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('网络错误，重置失败，请重试');
        setState(prev => ({ ...prev, isRedrawing: false }));
        return;
      }

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || '重置失败');
        setState(prev => ({ ...prev, isRedrawing: false }));
        return;
      }

      // 刷新可用参与人员
      const { participants, error: participantsError } = await fetchAvailableParticipants();

      if (participantsError) {
        toast.error('获取参与人员数据失败，请重试');
        setState(prev => ({ ...prev, isRedrawing: false }));
        return;
      }

      // 检查参与人数是否足够
      const { isInsufficient, shortage } = checkInsufficientParticipants(
        participants.length,
        currentRound.winnerCount
      );

      // 更新状态
      if (isInsufficient) {
        setState(prev => ({
          ...prev,
          isRedrawing: false,
          phase: 'insufficient',
          currentWinners: [],
          availableParticipants: participants,
          error: `可用参与人数不足：当前轮次需要 ${currentRound.winnerCount} 人，但仅有 ${participants.length} 人可用，还差 ${shortage} 人`,
          errorType: 'insufficient_participants',
          // 更新轮次状态
          activity: prev.activity ? {
            ...prev.activity,
            rounds: prev.activity.rounds.map(r =>
              r.id === currentRound.id ? { ...r, isDrawn: false } : r
            ),
          } : null,
        }));
        toast.warning('已重置，但可用参与人数不足');
        return;
      }

      setState(prev => ({
        ...prev,
        isRedrawing: false,
        phase: 'ready',
        currentWinners: [],
        availableParticipants: participants,
        error: null,
        errorType: null,
        // 更新轮次状态
        activity: prev.activity ? {
          ...prev.activity,
          rounds: prev.activity.rounds.map(r =>
            r.id === currentRound.id ? { ...r, isDrawn: false } : r
          ),
        } : null,
      }));

      toast.success('已重置，可以重新抽取');
    } catch {
      toast.error('网络错误，重置失败，请重试');
      setState(prev => ({ ...prev, isRedrawing: false }));
    }
  }, [currentRound, state.activity]);

  // 判断是否是最后一轮
  const isLastRound = state.activity
    ? state.activity.rounds.findIndex(
        (r, idx) => idx > state.currentRoundIndex && !r.isDrawn
      ) === -1
    : true;


  /**
   * 根据抽奖模式渲染对应的抽奖组件
   * Property 5: Lottery Mode Component Selection
   * 对于任何配置了抽奖模式的轮次，系统应渲染对应的抽奖动画组件
   * Requirements: 2.3
   */
  const renderLotteryComponent = useCallback(() => {
    if (!currentRound) return null;

    const commonProps = {
      participants: state.availableParticipants,
      winnerCount: currentRound.winnerCount,
      durationMs: currentRound.animationDurationMs,
      onComplete: handleDrawComplete,
      isRunning: state.isDrawing,
    };

    switch (currentRound.lotteryMode) {
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
  }, [currentRound, state.availableParticipants, state.isDrawing, handleDrawComplete]);

  // 加载状态
  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (state.phase === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">出错了</h1>
          <p className="text-white/60 mb-8">{state.error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleBack} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回活动列表
            </Button>
            <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        </div>
      </div>
    );
  }


  /**
   * 参与人数不足状态
   * Property 11: Insufficient Participants Error
   * 对于任何轮次，如果可用参与人数少于所需中奖人数，系统应显示错误信息并阻止抽奖
   * Requirements: 6.1
   */
  if (state.phase === 'insufficient' && state.activity && currentRound) {
    const { shortage } = checkInsufficientParticipants(
      state.availableParticipants.length,
      currentRound.winnerCount
    );

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-6">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">参与人数不足</h1>
          <p className="text-white/60 mb-4">{state.error}</p>

          {/* 详细信息卡片 */}
          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">
              第 {state.currentRoundIndex + 1} 轮：{currentRound.prizeName}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">需要中奖人数</span>
                <span className="text-white font-medium">{currentRound.winnerCount} 人</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">当前可用人数</span>
                <span className="text-amber-400 font-medium">{state.availableParticipants.length} 人</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-3">
                <span className="text-white/60">还差</span>
                <span className="text-red-400 font-bold">{shortage} 人</span>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-sm mb-6">
            请添加更多参与人员或调整轮次设置后重试
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="outline" onClick={handleBack} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回活动列表
            </Button>
            <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新重试
            </Button>
            {!isLastRound && (
              <Button onClick={handleNextRound} className="bg-purple-600 hover:bg-purple-700 text-white">
                跳过此轮
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 所有轮次完成状态
  // Property 12: All Rounds Completed State
  // 当所有轮次都已抽奖完成时，系统应显示完成状态并提供导出功能
  // Requirements: 6.2
  if (state.phase === 'completed' && state.activity) {
    return (
      <CompletionDisplay
        activityId={state.activity.id}
        activityName={state.activity.name}
        totalRounds={state.activity.rounds.length}
        onBack={handleBack}
      />
    );
  }


  // 准备/抽奖/结果状态 - 显示抽奖界面
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* 顶部导航栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              退出
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{state.activity?.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col min-h-screen pt-20 pb-8 px-6">
        {/* 轮次信息栏 */}
        {currentRound && state.activity && (
          <div className="max-w-5xl mx-auto w-full mb-6">
            <RoundInfoBar
              round={currentRound}
              roundIndex={state.currentRoundIndex}
              totalRounds={state.activity.rounds.length}
              availableCount={state.availableParticipants.length}
            />
          </div>
        )}

        {/* 抽奖区域 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {currentRound && (
            <>
              {/* 抽奖组件 */}
              {renderLotteryComponent()}

              {/* 开始抽奖按钮 - 仅在 ready 状态显示 */}
              {state.phase === 'ready' && !state.isDrawing && (
                <div className="mt-8">
                  <Button
                    onClick={handleStartDraw}
                    disabled={state.availableParticipants.length < currentRound.winnerCount}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    开始抽奖
                  </Button>
                  {state.availableParticipants.length < currentRound.winnerCount && (
                    <p className="text-red-400 text-sm mt-2 text-center">
                      可用人数不足（需要 {currentRound.winnerCount} 人，当前 {state.availableParticipants.length} 人）
                    </p>
                  )}
                </div>
              )}

              {/* 结果状态 - 显示中奖者和操作面板 */}
              {state.phase === 'results' && state.currentWinners.length > 0 && (
                <div className="mt-8 w-full">
                  {/* 中奖者展示 */}
                  <WinnerResultsDisplay
                    winners={state.currentWinners}
                    prizeName={currentRound.prizeName}
                  />

                  {/* 操作面板 */}
                  <div className="mt-8 flex justify-center">
                    <ActionPanel
                      onNextRound={handleNextRound}
                      onExport={handleExport}
                      onRedraw={handleRedraw}
                      isLastRound={isLastRound}
                      isRedrawing={state.isRedrawing}
                      isExporting={state.isExporting}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
