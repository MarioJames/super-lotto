'use client';

/**
 * ParticipantCard - Displays participant list with summary
 * Shows confirm/cancel actions for user confirmation
 *
 * Requirements: 2.3, 2.4
 */

import { ParticipantListPayload, CardAction } from '@/types';

interface ParticipantCardProps {
  data: ParticipantListPayload;
  onAction: (action: CardAction) => void;
}

/**
 * ParticipantCard - Displays participant list and confirmation buttons
 */
export function ParticipantCard({ data, onAction }: ParticipantCardProps) {
  const { participants, summary, totalCount, needsConfirmation } = data;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          参与人员列表
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          共 {totalCount} 人
        </span>
      </div>

      {summary && (
        <p className="text-gray-600 mb-4 text-sm">
          {summary}
        </p>
      )}

      <div className="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-gray-600 font-medium">姓名</th>
              {participants.some(p => p.department) && (
                <th className="text-left px-3 py-2 text-gray-600 font-medium">部门</th>
              )}
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <tr
                key={participant.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-3 py-2 text-gray-900">{participant.name}</td>
                {participants.some(p => p.department) && (
                  <td className="px-3 py-2 text-gray-600">{participant.department || '-'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {needsConfirmation && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onAction({ type: 'cancel-participants' })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={() => onAction({ type: 'confirm-participants' })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            确认导入
          </button>
        </div>
      )}
    </div>
  );
}
