import { getSupabaseClient } from '../db/supabase';
import type { ActivityRow, ActivityInsert, ActivityUpdate, ActivityParticipantRow, RoundRow } from '../db/types';
import type { Activity, ActivityWithRounds, CreateActivityDTO, UpdateActivityDTO, Round, Participant, LotteryMode } from '../types';
import { DEFAULT_ANIMATION_DURATION_MS } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    allowMultiWin: row.allow_multi_win,
    animationDurationMs: row.animation_duration_ms,
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
    isDrawn: row.is_drawn,
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


  async findWithRounds(id: number): Promise<ActivityWithRounds | null> {
    const supabase = getSupabaseClient();

    // Get activity
    const activity = await this.findById(id);
    if (!activity) return null;

    // Get rounds for this activity
    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('activity_id', id)
      .order('order_index', { ascending: true });

    if (roundsError) {
      throw parseSupabaseError(roundsError, 'findWithRounds');
    }

    const rounds = ((roundsData || []) as RoundRow[]).map(rowToRound);

    // Get participants for this activity
    const { data: apData, error: apError } = await supabase
      .from('activity_participants')
      .select('participant_id')
      .eq('activity_id', id);

    if (apError) {
      throw parseSupabaseError(apError, 'findWithRounds');
    }

    let participants: Participant[] = [];
    if (apData && apData.length > 0) {
      const participantIds = (apData as Pick<ActivityParticipantRow, 'participant_id'>[]).map(row => row.participant_id);

      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .in('id', participantIds)
        .order('id');

      if (participantsError) {
        throw parseSupabaseError(participantsError, 'findWithRounds');
      }

      participants = ((participantsData || []) as Array<{
        id: number;
        name: string;
        employee_id: string;
        department: string;
        email: string;
        created_at: string;
      }>).map(row => ({
        id: row.id,
        name: row.name,
        employeeId: row.employee_id,
        department: row.department,
        email: row.email,
        createdAt: new Date(row.created_at),
      }));
    }

    return {
      ...activity,
      rounds,
      participants,
    };
  }

  async create(data: CreateActivityDTO): Promise<Activity> {
    const supabase = getSupabaseClient();
    const animationDuration = data.animationDurationMs ?? DEFAULT_ANIMATION_DURATION_MS;

    const insertData: ActivityInsert = {
      name: data.name,
      description: data.description,
      allow_multi_win: data.allowMultiWin,
      animation_duration_ms: animationDuration,
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

    // Associate participants
    if (data.participantIds.length > 0) {
      const participantInserts = data.participantIds.map(participantId => ({
        activity_id: activityId,
        participant_id: participantId,
      }));

      const { error: apError } = await supabase
        .from('activity_participants')
        .insert(participantInserts as never);

      if (apError) {
        throw parseSupabaseError(apError, 'create');
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
    if (data.animationDurationMs !== undefined) updateData.animation_duration_ms = data.animationDurationMs;

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

    // Cascade delete is handled by foreign key constraints in PostgreSQL
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, 'delete');
    }

    return true;
  }

  async addParticipants(activityId: number, participantIds: number[]): Promise<void> {
    const supabase = getSupabaseClient();

    if (participantIds.length === 0) return;

    const inserts = participantIds.map(participantId => ({
      activity_id: activityId,
      participant_id: participantId,
    }));

    // Use upsert to ignore duplicates (similar to INSERT OR IGNORE in SQLite)
    const { error } = await supabase
      .from('activity_participants')
      .upsert(inserts as never, { onConflict: 'activity_id,participant_id', ignoreDuplicates: true });

    if (error) {
      throw parseSupabaseError(error, 'addParticipants');
    }
  }

  async removeParticipants(activityId: number, participantIds: number[]): Promise<void> {
    const supabase = getSupabaseClient();

    if (participantIds.length === 0) return;

    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .in('participant_id', participantIds);

    if (error) {
      throw parseSupabaseError(error, 'removeParticipants');
    }
  }
}

export const activityRepository = new ActivityRepository();
