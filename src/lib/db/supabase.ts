import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://ldobcwrfyengqrouqntp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * 获取 Supabase 客户端单例实例
 * 如果凭证缺失或无效，将记录清晰的错误信息
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseKey) {
    const error = new Error('SUPABASE_KEY 环境变量未配置');
    console.error('Supabase 配置错误:', error.message);
    throw error;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}

/**
 * 导出单例客户端实例（延迟初始化）
 */
export const supabase = {
  get client(): SupabaseClient<Database> {
    return getSupabaseClient();
  }
};
