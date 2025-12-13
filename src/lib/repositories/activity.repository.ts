import { getSupabaseClient } from '../db/supabase';
import type { ActivityRow, ActivityInsert, ActivityUpdate, RoundRow, ParticipantRow } from '../db/types';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO, Round, Participant, LotteryMode, ParticipantCSVRow } from '../types';
import { DEFAULT_ANIMATION_DURATION_MS } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    allowMultiWin: row.allow_multi_win,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToRound(row: RoundRow): Round {
  return {
    id: row.id,
    activityId: row.activity_id,
    prizeName: row.prize_name,
    prizeDescription: row.prize_description || '',
    winnerCount: row.winner_count,
    orderIndex: row.order_index,
    lotteryMode: row.lottery_mode as LotteryMode,
    animationDurationMs: row.animation_duration_ms,
    isDrawn: row.is_drawn,
    createdAt: new Date(row.created_at),
  };
}

function rowToParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    activityId: row.activity_id,
    name: row.name,
    employeeId: row.employee_id || '',
    department: row.department || '',
    email: row.email || '',
    createdAt: new Date(row.created_at),
  };
}

export class ActivityRepository {
  async findById(id: number): Promise<Activity | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findById');
    }

    return data ? rowToActivity(data as ActivityRow) : null;
  }

  async findAll(): Promise<Activity[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      throw parseSupabaseError(error, 'findAll');
    }

    return ((data || []) as ActivityRow[]).map(rowToActivity);
  }


  /**
   * 查找活动及其轮次和参与人员
   * 直接从 participants 表查询（通过 activity_id）
   */
  async findWithRounds(id: number): Promise<ActivityWithRounds | null> {
    const supabase = getSupabaseClient();

    // 获取活动
    const activity = await this.findById(id);
    if (!activity) return null;

    // 获取该活动的轮次
    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('activity_id', id)
      .order('order_index', { ascending: true });

    if (roundsError) {
      throw parseSupabaseError(roundsError, 'findWithRounds');
    }

    const rounds = ((roundsData || []) as RoundRow[]).map(rowToRound);

    // 直接从 participants 表获取该活动的参与人员
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('activity_id', id)
      .order('id');

    if (participantsError) {
      throw parseSupabaseError(participantsError, 'findWithRounds');
    }

    const participants = ((participantsData || []) as ParticipantRow[]).map(rowToParticipant);

    return {
      ...activity,
      rounds,
      participants,
    };
  }

  /**
   * 创建活动并直接创建参与人员
   */
  async create(data: CreateActivityDTO): Promise<Activity> {
    const supabase = getSupabaseClient();

    const insertData: ActivityInsert = {
      name: data.name,
      description: data.description,
      allow_multi_win: data.allowMultiWin,
    };

    const { data: created, error } = await supabase
      .from('activities')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'create');
    }

    if (!created) {
      throw new DatabaseError('创建活动失败：未返回数据', 'create');
    }

    const activityId = (created as ActivityRow).id;

    // 直接创建参与人员（关联到活动）
    if (data.participants && data.participants.length > 0) {
      const validParticipants = data.participants.filter(p => p.name && p.name.trim() !== '');

      if (validParticipants.length > 0) {
        const participantInserts = validParticipants.map((p: ParticipantCSVRow) => ({
          activity_id: activityId,
          name: p.name.trim(),
          employee_id: p.employeeId?.trim() || '',
          department: p.department?.trim() || '',
          email: p.email?.trim() || '',
        }));

        const { error: pError } = await supabase
          .from('participants')
          .insert(participantInserts as never);

        if (pError) {
          // 如果参与人员创建失败，删除已创建的活动
          await supabase.from('activities').delete().eq('id', activityId);
          throw parseSupabaseError(pError, 'create');
        }
      }
    }

    return rowToActivity(created as ActivityRow);
  }

  async update(id: number, data: UpdateActivityDTO): Promise<Activity | null> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return null;

    const updateData: ActivityUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.allowMultiWin !== undefined) updateData.allow_multi_win = data.allowMultiWin;

    const { data: updated, error } = await supabase
      .from('activities')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'update');
    }

    return updated ? rowToActivity(updated as ActivityRow) : null;
  }

  async delete(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return false;

    // 级联删除由 PostgreSQL 外键约束处理
    // participants 表的 activity_id 外键设置了 ON DELETE CASCADE
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, 'delete');
    }

    return true;
  }
}

export const activityRepository = new ActivityRepository();
