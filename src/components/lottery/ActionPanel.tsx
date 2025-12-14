'use client';

import { Button } from '@/components/ui/button';
import { ChevronRight, Download, RotateCcw, Loader2 } from 'lucide-react';

interface ActionPanelProps {
  onNextRound: () => void;
  onExport: () => void;
  onRedraw: () => void;
  isLastRound: boolean;
  isRedrawing: boolean;
  isExporting: boolean;
}

/**
 * 抽奖操作面板组件
 * 显示三个操作按钮：进入下一轮、导出抽奖名单、重新抽取
 * Requirements: 3.1, 3.5
 */
export function ActionPanel({
  onNextRound,
  onExport,
  onRedraw,
  isLastRound,
  isRedrawing,
  isExporting,
}: ActionPanelProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* 进入下一轮按钮 */}
      {/* Property 7: Last Round Button State - 最后一轮时禁用 */}
      <Button
        onClick={onNextRound}
        disabled={isLastRound || isRedrawing}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4 mr-2" />
        {isLastRound ? '已是最后一轮' : '进入下一轮'}
      </Button>

      {/* 导出抽奖名单按钮 */}
      <Button
        onClick={onExport}
        disabled={isExporting || isRedrawing}
        variant="outline"
        className="bg-white/5 border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isExporting ? '导出中...' : '导出抽奖名单'}
      </Button>

      {/* 重新抽取按钮 */}
      <Button
        onClick={onRedraw}
        disabled={isRedrawing || isExporting}
        variant="outline"
        className="bg-white/5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {isRedrawing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-2" />
        )}
        {isRedrawing ? '重置中...' : '重新抽取'}
      </Button>
    </div>
  );
}

export default ActionPanel;
