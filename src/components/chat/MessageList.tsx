'use client';

import { UIMessage } from 'ai';
import { CardRenderer } from '@/components/cards';
import { CardAction, CardData } from '@/types';
import { mapToolResultToCard } from '@/lib/card-mapper';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onCardAction: (action: CardAction) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;

function getTextContent(message: UIMessage): string {
  return (message.parts as AnyPart[])
    .filter((part: AnyPart) => part.type === 'text')
    .map((part: AnyPart) => part.text as string)
    .join('');
}

function getToolParts(message: UIMessage): AnyPart[] {
  return (message.parts as AnyPart[]).filter(
    (part: AnyPart) => part.type === 'dynamic-tool' || (typeof part.type === 'string' && part.type.startsWith('tool-'))
  );
}

function getToolName(part: AnyPart): string {
  if (part.type === 'dynamic-tool' && part.toolName) {
    return part.toolName;
  }
  if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
    return part.type.replace('tool-', '');
  }
  return 'unknown';
}

export function MessageList({ messages, isLoading, onCardAction }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const textContent = getTextContent(message);
        const toolParts = getToolParts(message);
        
        return (
          <div key={message.id} className="space-y-2">
            {textContent && (
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className="whitespace-pre-wrap">{textContent}</p>
                </div>
              </div>
            )}

            {toolParts.map((toolPart: AnyPart, index: number) => {
              const toolName = getToolName(toolPart);
              
              if (toolPart.state === 'output-available') {
                const card = mapToolResultToCard(toolName, toolPart.output);
                if (card) {
                  return (
                    <div key={`${message.id}-tool-${index}`} className="my-2">
                      <CardRenderer card={card as CardData} onAction={onCardAction} />
                    </div>
                  );
                }
              }
              
              if (toolPart.state === 'output-error') {
                return (
                  <div key={`${message.id}-tool-${index}`} className="my-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-red-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">处理失败: {toolPart.errorText}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                return (
                  <div key={`${message.id}-tool-${index}`} className="my-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        <span className="text-sm">正在处理: {toolName}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
