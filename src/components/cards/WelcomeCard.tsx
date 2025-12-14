'use client';

/**
 * WelcomeCard - Welcome card component displayed on first visit
 * Shows greeting message and action buttons
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import { WelcomePayload, CardAction } from '@/types';

interface WelcomeCardProps {
  data: WelcomePayload;
  onAction: (action: CardAction) => void;
}

/**
 * WelcomeCard - Displays greeting and action buttons
 */
export function WelcomeCard({ data, onAction }: WelcomeCardProps) {
  const handleActionClick = (actionType: 'howToUse' | 'uploadCsv' | 'configRound') => {
    if (actionType === 'howToUse') {
      onAction({ type: 'how-to-use' });
    }
    // Other actions can be handled by parent component
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
      <h2 className="text-xl font-semibold text-indigo-900 mb-2">
        {data.title}
      </h2>
      <p className="text-gray-600 mb-4">
        {data.message}
      </p>
      <div className="flex flex-wrap gap-2">
        {data.actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.action)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
