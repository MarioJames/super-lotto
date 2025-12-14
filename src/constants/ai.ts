/**
 * AI Provider / Model 配置常量
 * 说明：当前对话助手暂未提供在 UI 中切换 Provider 的能力，这里作为统一配置入口。
 */

export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini'],
  },
} as const;

export type AIProviderId = keyof typeof AI_PROVIDERS;

export const DEFAULT_CHAT_PROVIDER: AIProviderId = 'openai';
export const DEFAULT_CHAT_MODEL = AI_PROVIDERS[DEFAULT_CHAT_PROVIDER].defaultModel;
export const DEFAULT_CHAT_PROVIDER_LABEL = AI_PROVIDERS[DEFAULT_CHAT_PROVIDER].label;
export const DEFAULT_CHAT_BADGE = `${DEFAULT_CHAT_PROVIDER_LABEL} · ${DEFAULT_CHAT_MODEL}`;

