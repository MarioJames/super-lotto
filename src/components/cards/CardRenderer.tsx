'use client';

/**
 * CardRenderer - Unified card rendering component
 * Renders different card types based on CardData type
 *
 * Requirements: 1.1, 3.5, 4.5
 */

import {
  CardData,
  CardAction,
  WelcomePayload,
  ParticipantListPayload,
  RoundConfigPayload,
  WinnerResultPayload,
  ErrorPayload,
} from '@/types';
import { WelcomeCard } from './WelcomeCard';
import { ParticipantCard } from './ParticipantCard';
import { RoundConfigCard } from './RoundConfigCard';
import { WinnerCard } from './WinnerCard';
import { ErrorCard } from './ErrorCard';

interface CardRendererProps {
  card: CardData;
  onAction: (action: CardAction) => void;
}

/**
 * CardRenderer - Switch-based rendering for all card types
 */
export function CardRenderer({ card, onAction }: CardRendererProps) {
  switch (card.type) {
    case 'welcome':
      return <WelcomeCard data={card.data as WelcomePayload} onAction={onAction} />;
    case 'participant-list':
      return <ParticipantCard data={card.data as ParticipantListPayload} onAction={onAction} />;
    case 'round-config':
      return <RoundConfigCard data={card.data as RoundConfigPayload} onAction={onAction} />;
    case 'winner-result':
      return <WinnerCard data={card.data as WinnerResultPayload} onAction={onAction} />;
    case 'error':
      return <ErrorCard data={card.data as ErrorPayload} onAction={onAction} />;
    default:
      return null;
  }
}
