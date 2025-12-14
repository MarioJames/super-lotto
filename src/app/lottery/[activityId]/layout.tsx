import { Toaster } from 'sonner';

/**
 * 沉浸式抽奖页面布局
 * 独立于主应用布局，不包含 Sidebar
 * Requirements: 1.1, 2.1
 */
export default function ImmersiveLotteryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
