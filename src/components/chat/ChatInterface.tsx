'use client';

/**
 * ChatInterface - Main chat component combining MessageList and MessageInput
 * Handles message sending, file uploads, and displays welcome card on first load
 *
 * Requirements: 1.1, 6.1
 */

import { useState, useCallback, useEffect } from 'react';
import { UIMessage } from 'ai';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { CardRenderer } from '@/components/cards';
import { CardAction, CardData } from '@/types';
import { createWelcomeCard, createErrorCard } from '@/lib/card-mapper';
import { useLottery } from '@/contexts/LotteryContext';
import { HowToUseModal } from '@/components/HowToUseModal';

interface ChatInterfaceProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onFileUpload?: (file: File) => Promise<void>;
}

/**
 * ChatInterface - Main chat UI component
 */
export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onFileUpload,
}: ChatInterfaceProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeCard] = useState<CardData<'welcome'>>(() => createWelcomeCard());
  const [errorCard, setErrorCard] = useState<CardData<'error'> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const lottery = useLottery();

  // Hide welcome card when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  // Handle card actions
  const handleCardAction = useCallback((action: CardAction) => {
    switch (action.type) {
      case 'how-to-use':
        setShowHowToUse(true);
        break;
      case 'confirm-participants':
        // Participants are already set via context in file upload flow
        setErrorCard(null);
        break;
      case 'cancel-participants':
        lottery.setParticipants([]);
        break;
      case 'confirm-round':
        // Round confirmation handled by context
        break;
      case 'edit-round':
        onSendMessage('我想修改抽奖轮次配置');
        break;
      case 'export-winners':
        lottery.exportWinners(action.roundId);
        break;
      case 'retry':
        setErrorCard(null);
        break;
      default:
        break;
    }
  }, [lottery, onSendMessage]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!onFileUpload) {
      setErrorCard(createErrorCard(
        '功能未启用',
        '文件上传功能暂未启用',
        false
      ));
      return;
    }

    setIsUploading(true);
    setErrorCard(null);

    try {
      await onFileUpload(file);
      setShowWelcome(false);
    } catch (error) {
      setErrorCard(createErrorCard(
        '上传失败',
        error instanceof Error ? error.message : '文件上传失败，请重试',
        true
      ));
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload]);

  // Handle send message
  const handleSendMessage = useCallback((content: string) => {
    setShowWelcome(false);
    setErrorCard(null);
    onSendMessage(content);
  }, [onSendMessage]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {showWelcome && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <CardRenderer card={welcomeCard} onAction={handleCardAction} />
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading || isUploading}
            onCardAction={handleCardAction}
          />
        )}
      </div>

      {/* Error card */}
      {errorCard && (
        <div className="px-4 pb-2">
          <CardRenderer card={errorCard} onAction={handleCardAction} />
        </div>
      )}

      {/* Input area */}
      <MessageInput
        onSend={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={isLoading || isUploading}
      />

      {/* How to Use Modal */}
      {showHowToUse && (
        <HowToUseModal onClose={() => setShowHowToUse(false)} />
      )}
    </div>
  );
}


