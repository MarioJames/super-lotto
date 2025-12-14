'use client';

/**
 * ErrorCard - Displays error messages with optional retry button
 *
 * Requirements: 2.5
 */

import { ErrorPayload, CardAction } from '@/types';

interface ErrorCardProps {
  data: ErrorPayload;
  onAction: (action: CardAction) => void;
}

/**
 * ErrorCard - Displays error message and retry option
 */
export function ErrorCard({ data, onAction }: ErrorCardProps) {
  const { title, message, retryable } = data;

  return (
    <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">
            {title}
          </h3>
          <p className="text-red-700 text-sm mb-4">
            {message}
          </p>
          {retryable && (
            <button
              onClick={() => onAction({ type: 'retry' })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
