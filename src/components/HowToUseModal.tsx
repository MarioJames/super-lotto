'use client';

/**
 * HowToUseModal - Modal component showing usage instructions
 * Triggered from WelcomeCard
 *
 * Requirements: 1.2
 */

interface HowToUseModalProps {
  onClose: () => void;
}

/**
 * HowToUseModal - Modal showing usage instructions for the lottery system
 */
export function HowToUseModal({ onClose }: HowToUseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">使用说明</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 text-gray-600">
            <section>
              <h3 className="font-medium text-gray-900 mb-2">1. 导入参与人员</h3>
              <p>点击输入框左侧的附件按钮，上传包含参与人员信息的 CSV 文件。CSV 文件需要包含 name 列。</p>
            </section>

            <section>
              <h3 className="font-medium text-gray-900 mb-2">2. 配置抽奖轮次</h3>
              <p>通过自然语言告诉我抽奖轮次信息，例如：</p>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>&quot;第一轮抽奖，奖品是 iPhone，抽取 3 名&quot;</li>
                <li>&quot;配置第二轮，奖品名称是现金红包，数量 5 个&quot;</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-gray-900 mb-2">3. 执行抽奖</h3>
              <p>配置完成后，可以说：</p>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>&quot;开始抽奖&quot;</li>
                <li>&quot;下一轮&quot;</li>
                <li>&quot;继续&quot;</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-gray-900 mb-2">4. 导出结果</h3>
              <p>每轮抽奖完成后，可以点击结果卡片上的导出按钮，下载中奖名单。</p>
            </section>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
