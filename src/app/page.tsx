'use client';

/**
 * Main Lottery Agent Page
 * Wraps the app with LotteryProvider and renders ChatInterface
 *
 * Requirements: 1.1, 7.4
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { LotteryProvider, useLottery } from '@/contexts/LotteryContext';
import { ChatInterface } from '@/components/chat';
import { useCallback, useMemo } from 'react';
import { DEFAULT_CHAT_BADGE } from '@/constants/ai';

/**
 * LotteryChat - Inner component that uses lottery context and chat
 */
function LotteryChat() {
  const lottery = useLottery();

  // Create transport with body containing current lottery state
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: {
        participants: lottery.participants,
        rounds: lottery.rounds,
        winners: lottery.winners,
        currentRoundIndex: lottery.currentRoundIndex,
      },
    });
  }, [lottery.participants, lottery.rounds, lottery.winners, lottery.currentRoundIndex]);

  const { messages, status, sendMessage } = useChat({
    transport,
  });

  // Convert status to isLoading boolean for ChatInterface
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage({ text: content });
    },
    [sendMessage]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '文件上传失败');
      }

      // Store participants in context
      lottery.setParticipants(result.participants);

      // Send message to AI about the uploaded participants
      sendMessage({
        text: `我已上传参与人员名单，共 ${result.participants.length} 人。请帮我确认参与人员信息。`,
      });
    },
    [sendMessage, lottery]
  );

  return (
    <ChatInterface
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onFileUpload={handleFileUpload}
    />
  );
}


/**
 * Home - Main page component
 */
export default function Home() {
  return (
    <LotteryProvider>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
        {/* Background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[960px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-fuchsia-500/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(40%_30%_at_80%_20%,rgba(99,102,241,0.16),transparent_60%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] [-webkit-mask-image:radial-gradient(circle_at_center,black,transparent_70%)] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
        </div>

        {/* Header */}
        <header className="relative border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 via-indigo-500/30 to-fuchsia-500/30 ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(56,189,248,0.18)]">
                  <svg
                    className="h-6 w-6 text-cyan-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold leading-none">
                    <span className="bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
                      抽奖助手
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-slate-300">智能抽奖系统</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />
                <span>{DEFAULT_CHAT_BADGE}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative flex-1 overflow-hidden">
          <div className="mx-auto h-full max-w-5xl px-4 py-6">
            <div className="h-full rounded-2xl bg-gradient-to-r from-cyan-500/35 via-indigo-500/35 to-fuchsia-500/35 p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(56,189,248,0.12)]">
              <div className="h-full overflow-hidden rounded-2xl bg-white">
                <LotteryChat />
              </div>
            </div>
          </div>
        </main>
      </div>
    </LotteryProvider>
  );
}
