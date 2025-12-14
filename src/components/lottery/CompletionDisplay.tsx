'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, PartyPopper, Sparkles, Trophy, Star } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionDisplayProps {
  activityId: number;
  activityName: string;
  totalRounds: number;
  onBack: () => void;
}

/**
 * 抽奖完成状态展示组件
 * Property 12: All Rounds Completed State
 * 当所有轮次都已抽奖完成时，系统应显示完成状态并提供导出功能
 * Requirements: 6.2
 */
export function CompletionDisplay({
  activityId,
  activityName,
  totalRounds,
  onBack,
}: CompletionDisplayProps) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 导出所有轮次的中奖名单
   */
  const handleExportAll = async () => {
    setIsExporting(true);

    try {
      const res = await fetch(`/api/export/activity/${activityId}`);

      if (!res.ok) {
        throw new Error('导出失败');
      }

      // 获取文件内容并触发下载
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_${activityId}_all_winners.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('导出成功');
    } catch {
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* 背景装饰效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 渐变光晕 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* 星星装饰 */}
        {[...Array(30)].map((_, i) => (
          <Star
            key={i}
            className="absolute text-yellow-400/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              width: `${8 + Math.random() * 16}px`,
              height: `${8 + Math.random() * 16}px`,
            }}
          />
        ))}

        {/* 闪光效果 */}
        {[...Array(20)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className="absolute text-amber-300/30 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              width: `${12 + Math.random() * 12}px`,
              height: `${12 + Math.random() * 12}px`,
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 text-center max-w-lg mx-auto px-6">
        {/* 庆祝图标 */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <PartyPopper className="h-12 w-12 text-amber-400 animate-bounce" />
          <Trophy className="h-16 w-16 text-yellow-400 animate-pulse" />
          <PartyPopper className="h-12 w-12 text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* 标题 */}
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 mb-4">
          🎊 抽奖圆满完成！
        </h1>

        {/* 活动信息 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">{activityName}</h2>
          <p className="text-white/60">
            共完成 <span className="text-amber-400 font-semibold">{totalRounds}</span> 轮抽奖
          </p>
          <p className="text-white/50 text-sm mt-2">
            恭喜所有中奖者，感谢大家的参与！
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleExportAll}
            disabled={isExporting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? '导出中...' : '导出全部中奖名单'}
          </Button>

          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回活动列表
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CompletionDisplay;
