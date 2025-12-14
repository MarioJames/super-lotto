'use client';

/**
 * WinnerCard - Displays lottery winners with round info
 * Shows winner list and export button with correct filename
 *
 * Requirements: 4.5, 5.1, 5.2, 5.3
 */

import { WinnerResultPayload, CardAction } from '@/types';
import { generateExportFilename } from '@/lib/lottery';

interface WinnerCardProps {
  data: WinnerResultPayload;
  onAction: (action: CardAction) => void;
}

/**
 * WinnerCard - Displays winners and export functionality
 */
export function WinnerCard({ data, onAction }: WinnerCardProps) {
  const { round, winners, remainingParticipants, canExport } = data;
  const exportFilename = generateExportFilename(round);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🎉 第 {round.roundNumber} 轮中奖名单
          </h3>
          <p className="text-sm text-gray-500">
            {round.prizeName} × {round.prizeQuantity}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {winners.map((winner, index) => (
            <div
              key={winner.id}
              className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
            >
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium text-green-800">
                {index + 1}
              </span>
              <span className="text-gray-900 font-medium truncate">
                {winner.participantName}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          剩余参与人数: {remainingParticipants} 人
        </p>
        {canExport && (
          <button
            onClick={() => onAction({ type: 'export-winners', roundId: round.id })}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出 ({exportFilename}.csv)
          </button>
        )}
      </div>
    </div>
  );
}
