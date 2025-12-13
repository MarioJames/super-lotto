import { getSupabaseClient } from '../db/supabase';
import type { RoundRow, RoundInsert, RoundUpdate } from '../db/types';
import type { Round, CreateRoundDTO, UpdateRoundDTO, LotteryMode } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

function rowToRound(row: RoundRow): Round {
  return {
    id: row.id,
    activityId: row.activity_id,
    prizeName: row.prize_name,
    prizeDescription: row.prize_description || '',
    winnerCount: row.winner_count,
    orderIndex: row.order_index,
    lotteryMode: row.lottery_mode as LotteryMode,
    isDrawn: row.is_drawn,
    createdAt: new Date(row.created_at),
  };
}

export class RoundRepository {
  async findById(id: number): Promise<Round | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findById');
    }

    return data ? rowToRound(data as RoundRow) : null;
  }

  async findByActivityId(activityId: number): Promise<Round[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('activity_id', activityId)
      .order('order_index', { ascending: true });

    if (error) {
      throw parseSupabaseError(error, 'findByActivityId');
    }

    return ((data || []) as RoundRow[]).map(rowToRound);
  }

  async create(activityId: number, data: CreateRoundDTO): Promise<Round> {
    const supabase = getSupabaseClient();

    // 获取当前最大 order_index
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('rounds')
      .select('order_index')
      .eq('activity_id', activityId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    let orderIndex = 0;
    if (maxOrderError) {
      // PGRST116 表示没有找到记录，这是正常情况（第一个轮次）
      if (maxOrderError.code !== 'PGRST116') {
        throw parseSupabaseError(maxOrderError, 'create');
      }
    } else if (maxOrderData) {
      orderIndex = (maxOrderData as Pick<RoundRow, 'order_index'>).order_index + 1;
    }

    const insertData: RoundInsert = {
      activity_id: activityId,
      prize_name: data.prizeName,
      prize_description: data.prizeDescription,
      winner_count: data.winnerCount,
      order_index: orderIndex,
      lottery_mode: data.lotteryMode,
      is_drawn: false,
    };

    const { data: created, error } = await supabase
      .from('rounds')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'create');
    }

    if (!created) {
      throw new DatabaseError('创建轮次失败：未返回数据', 'create');
    }

    return rowToRound(created as RoundRow);
  }

  async update(id: number, data: UpdateRoundDTO): Promise<Round | null> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return null;

    const updateData: RoundUpdate = {};
    if (data.prizeName !== undefined) updateData.prize_name = data.prizeName;
    if (data.prizeDescription !== undefined) updateData.prize_description = data.prizeDescription;
    if (data.winnerCount !== undefined) updateData.winner_count = data.winnerCount;
    if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex;
    if (data.lotteryMode !== undefined) updateData.lottery_mode = data.lotteryMode;

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const { data: updated, error } = await supabase
      .from('rounds')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'update');
    }

    return updated ? rowToRound(updated as RoundRow) : null;
  }

  async delete(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return false;

    const { error } = await supabase
      .from('rounds')
      .delete()
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, 'delete');
    }

    return true;
  }

  async markAsDrawn(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return false;

    const { error } = await supabase
      .from('rounds')
      .update({ is_drawn: true } as never)
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, 'markAsDrawn');
    }

    return true;
  }

  async updateOrder(activityId: number, roundIds: number[]): Promise<void> {
    const supabase = getSupabaseClient();

    // 逐个更新轮次的 order_index
    for (let i = 0; i < roundIds.length; i++) {
      const { error } = await supabase
        .from('rounds')
        .update({ order_index: i } as never)
        .eq('id', roundIds[i])
        .eq('activity_id', activityId);

      if (error) {
        throw parseSupabaseError(error, 'updateOrder');
      }
    }
  }
}

export const roundRepository = new RoundRepository();
