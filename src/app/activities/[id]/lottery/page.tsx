'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Pause, SkipForward, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityWithRounds, Participant, Round, LotteryMode } from '@/lib/types';
import { WheelOfFortune, DoubleBallLottery, SlotMachine, HorseRace, ScratchCard, ZumaLottery } from '@/components/lottery-modes';

const LOTTERY_MODE_NAMES: Record<LotteryMode, string> = {
  wheel: '转盘',
  double_ball: '双色球',
  scratch: '刮刮乐',
  zuma: '祖玛',
  horse_race: '赛马',
  slot_machine: '老虎机',
};

export default function LotteryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityWithRounds | null>(null);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [roundWinners, setRoundWinners] = useState<Map<number, Participant[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
    fetchAvailableParticipants();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${id}`);
      const data = await res.json();
      if (data.success) {
        setActivity(data.data);
        // 找到第一个未抽奖的轮次
        const firstUndrawn = data.data.rounds.findIndex((r: Round) => !r.isDrawn);
        setCurrentRoundIndex(firstUndrawn >= 0 ? firstUndrawn : 0);
      }
    } catch {
      toast.error('获取活动失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParticipants = async () => {
    try {
      const res = await fetch(`/api/lottery/available/${id}`);
      const data = await res.json();
      if (data.success) setAvailableParticipants(data.data);
    } catch {
      console.error('获取可用参与人员失败');
    }
  };

  const currentRound = activity?.rounds[currentRoundIndex];

  const handleDrawComplete = useCallback(async (winners: Participant[]) => {
    if (!currentRound) return;

    try {
      // 保存抽奖结果到服务器
      const res = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: currentRound.id }),
      });
      const data = await res.json();

      if (data.success) {
        setRoundWinners(prev => new Map(prev).set(currentRound.id, winners));
        toast.success(`第 ${currentRoundIndex + 1} 轮抽奖完成！`);

        // 刷新数据
        await fetchActivity();
        await fetchAvailableParticipants();

        // 自动模式下进入下一轮
        if (isAutoMode && activity && currentRoundIndex < activity.rounds.length - 1) {
          setTimeout(() => {
            setCurrentRoundIndex(prev => prev + 1);
            setIsDrawing(false);
          }, 3000);
        } else {
          setIsDrawing(false);
        }
      } else {
        toast.error(data.error || '保存抽奖结果失败');
        setIsDrawing(false);
      }
    } catch {
      toast.error('保存抽奖结果失败');
      setIsDrawing(false);
    }
  }, [currentRound, currentRoundIndex, isAutoMode, activity]);

  const startDraw = () => {
    if (!currentRound || currentRound.isDrawn) {
      toast.error('该轮次已抽奖');
      return;
    }
    if (availableParticipants.length < currentRound.winnerCount) {
      toast.error(`可用参与人员不足，需要 ${currentRound.winnerCount} 人，当前 ${availableParticipants.length} 人`);
      return;
    }
    setIsDrawing(true);
  };

  const nextRound = () => {
    if (activity && currentRoundIndex < activity.rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    }
  };

  const handleExport = () => {
    window.open(`/api/export/activity/${id}`, '_blank');
  };

  const renderLotteryMode = () => {
    if (!currentRound || !activity) return null;

    const props = {
      participants: availableParticipants,
      winnerCount: currentRound.winnerCount,
      durationMs: currentRound.animationDurationMs,
      onComplete: handleDrawComplete,
      isRunning: isDrawing,
    };

    switch (currentRound.lotteryMode) {
      case 'wheel': return <WheelOfFortune {...props} />;
      case 'double_ball': return <DoubleBallLottery {...props} />;
      case 'slot_machine': return <SlotMachine {...props} />;
      case 'horse_race': return <HorseRace {...props} />;
      case 'scratch': return <ScratchCard {...props} />;
      case 'zuma': return <ZumaLottery {...props} />;
      default: return <WheelOfFortune {...props} />;
    }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;
  if (!activity) return <div className="text-center py-8">活动不存在</div>;

  const allDrawn = activity.rounds.every(r => r.isDrawn);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />返回
          </Button>
          <h1 className="text-2xl font-bold">{activity.name} - 抽奖</h1>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />导出结果
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：轮次列表 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">抽奖轮次</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.rounds.map((round, idx) => (
              <div
                key={round.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  idx === currentRoundIndex
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : round.isDrawn
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
                onClick={() => !isDrawing && setCurrentRoundIndex(idx)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">第 {idx + 1} 轮</span>
                  {round.isDrawn && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">已完成</span>}
                </div>
                <p className="text-sm text-slate-600">{round.prizeName}</p>
                <p className="text-xs text-slate-400">
                  {round.winnerCount} 人 | {LOTTERY_MODE_NAMES[round.lotteryMode]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 右侧：抽奖区域 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 当前轮次信息 */}
          {currentRound && (
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">
                      第 {currentRoundIndex + 1} 轮：{currentRound.prizeName}
                    </h2>
                    <p className="text-slate-500">
                      {currentRound.prizeDescription || '无描述'} |
                      中奖人数：{currentRound.winnerCount} |
                      模式：{LOTTERY_MODE_NAMES[currentRound.lotteryMode]} |
                      可用人数：{availableParticipants.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAutoMode(!isAutoMode)}
                    >
                      {isAutoMode ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                      {isAutoMode ? '自动' : '手动'}
                    </Button>
                    {!currentRound.isDrawn && (
                      <Button onClick={startDraw} disabled={isDrawing}>
                        <Play className="h-4 w-4 mr-2" />
                        {isDrawing ? '抽奖中...' : '开始抽奖'}
                      </Button>
                    )}
                    {currentRound.isDrawn && currentRoundIndex < activity.rounds.length - 1 && (
                      <Button onClick={nextRound} disabled={isDrawing}>
                        <SkipForward className="h-4 w-4 mr-2" />下一轮
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 抽奖动画区域 */}
          <Card className="min-h-[600px]">
            <CardContent className="py-8">
              {allDrawn ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎊</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">所有轮次已完成！</h2>
                  <p className="text-slate-500 mb-4">恭喜所有中奖者</p>
                  <Button onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />导出中奖名单
                  </Button>
                </div>
              ) : (
                renderLotteryMode()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
