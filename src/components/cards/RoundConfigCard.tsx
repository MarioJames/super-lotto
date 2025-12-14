'use client';

/**
 * RoundConfigCard - Displays lottery round configuration
 * Shows round number, prize name, quantity with confirm/edit actions
 *
 * Requirements: 3.3, 3.5
 */

import { RoundConfigPayload, CardAction } from '@/types';

interface RoundConfigCardProps {
  data: RoundConfigPayload;
  onAction: (action: CardAction) => void;
}

/**
 * RoundConfigCard - Displays round configuration and confirmation buttons
 */
export function RoundConfigCard({ data, onAction }: RoundConfigCardProps) {
  const { round, description, needsConfirmation } = data;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-amber-700 font-bold">{round.roundNumber}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            第 {round.roundNumber} 轮抽奖
          </h3>
          <p className="text-sm text-gray-500">轮次配置</p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">奖品名称</p>
            <p className="text-gray-900 font-medium">{round.prizeName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">奖品数量</p>
            <p className="text-gray-900 font-medium">{round.prizeQuantity} 份</p>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-gray-600 mb-4 text-sm">
          {description}
        </p>
      )}

      {needsConfirmation && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onAction({ type: 'edit-round' })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            修改
          </button>
          <button
            onClick={() => onAction({ type: 'confirm-round' })}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
          >
            确认配置
          </button>
        </div>
      )}
    </div>
  );
}
