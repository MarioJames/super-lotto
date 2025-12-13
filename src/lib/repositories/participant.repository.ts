import { getSupabaseClient } from '../db/supabase';
import type { ParticipantRow, ParticipantInsert, ParticipantUpdate, RoundRow, WinnerRow } from '../db/types';
import type { Participant, UpdateParticipantDTO, ParticipantCSVRow, ImportResult } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

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

export class ParticipantRepository {
  /**
   * 根据ID查找参与人员（需要指定活动ID以确保隔离）
   */
  async findById(activityId: number, id: number): Promise<Participant | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .eq('activity_id', activityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findById');
    }

    return data ? rowToParticipant(data as ParticipantRow) : null;
  }

  /**
   * 查找活动的所有参与人员
   */
  async findByActivityId(activityId: number): Promise<Participant[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('activity_id', activityId)
      .order('id');

    if (error) {
      throw parseSupabaseError(error, 'findByActivityId');
    }

    return ((data || []) as ParticipantRow[]).map(rowToParticipant);
  }

  /**
   * 在活动内根据工号查找参与人员
   */
  async findByEmployeeIdInActivity(activityId: number, employeeId: string): Promise<Participant | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('activity_id', activityId)
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findByEmployeeIdInActivity');
    }

    return data ? rowToParticipant(data as ParticipantRow) : null;
  }


  /**
   * 为活动创建单个参与人员
   */
  async createForActivity(activityId: number, data: ParticipantCSVRow): Promise<Participant> {
    const supabase = getSupabaseClient();
    const insertData: ParticipantInsert = {
      activity_id: activityId,
      name: data.name,
      employee_id: data.employeeId || '',
      department: data.department || '',
      email: data.email || '',
    };

    const { data: created, error } = await supabase
      .from('participants')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'createForActivity');
    }

    if (!created) {
      throw new DatabaseError('创建参与人员失败：未返回数据', 'createForActivity');
    }

    return rowToParticipant(created as ParticipantRow);
  }

  /**
   * 为活动批量导入参与人员（从CSV数据）
   */
  async importForActivity(activityId: number, data: ParticipantCSVRow[]): Promise<ImportResult> {
    const supabase = getSupabaseClient();
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 仅姓名必填
        if (!row.name || row.name.trim() === '') {
          result.failed++;
          result.errors.push({ row: i + 1, message: '姓名不能为空' });
          continue;
        }

        const insertData: ParticipantInsert = {
          activity_id: activityId,
          name: row.name.trim(),
          employee_id: row.employeeId?.trim() || '',
          department: row.department?.trim() || '',
          email: row.email?.trim() || '',
        };

        const { error } = await supabase
          .from('participants')
          .insert(insertData as never);

        if (error) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            message: error.message || '未知错误'
          });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return result;
  }

  /**
   * 更新活动中的参与人员
   */
  async updateInActivity(activityId: number, id: number, data: UpdateParticipantDTO): Promise<Participant | null> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(activityId, id);
    if (!existing) return null;

    const updateData: ParticipantUpdate = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.employeeId !== undefined) updateData.employee_id = data.employeeId;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email !== undefined) updateData.email = data.email;

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const { data: updated, error } = await supabase
      .from('participants')
      .update(updateData as never)
      .eq('id', id)
      .eq('activity_id', activityId)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'updateInActivity');
    }

    return updated ? rowToParticipant(updated as ParticipantRow) : null;
  }

  /**
   * 从活动中删除参与人员
   */
  async deleteFromActivity(activityId: number, id: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(activityId, id);
    if (!existing) return false;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)
      .eq('activity_id', activityId);

    if (error) {
      throw parseSupabaseError(error, 'deleteFromActivity');
    }

    return true;
  }

  /**
   * 查找活动中可参与抽奖的人员（排除已中奖者，除非允许多次中奖）
   */
  async findAvailableForRound(activityId: number, allowMultiWin: boolean): Promise<Participant[]> {
    const supabase = getSupabaseClient();

    if (allowMultiWin) {
      return this.findByActivityId(activityId);
    }

    // 获取活动的所有参与人员
    const participants = await this.findByActivityId(activityId);
    if (participants.length === 0) {
      return [];
    }

    const participantIds = participants.map(p => p.id);

    // 获取该活动的所有轮次
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('id')
      .eq('activity_id', activityId);

    if (roundsError) {
      throw parseSupabaseError(roundsError, 'findAvailableForRound');
    }

    let winnerParticipantIds: number[] = [];
    if (rounds && rounds.length > 0) {
      const roundIds = (rounds as Pick<RoundRow, 'id'>[]).map(r => r.id);
      const { data: winners, error: winnersError } = await supabase
        .from('winners')
        .select('participant_id')
        .in('round_id', roundIds);

      if (winnersError) {
        throw parseSupabaseError(winnersError, 'findAvailableForRound');
      }

      winnerParticipantIds = ((winners || []) as Pick<WinnerRow, 'participant_id'>[]).map(w => w.participant_id);
    }

    // 过滤掉已中奖者
    return participants.filter(p => !winnerParticipantIds.includes(p.id));
  }

  /**
   * 获取活动的参与人员数量
   */
  async countByActivityId(activityId: number): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    if (error) {
      throw parseSupabaseError(error, 'countByActivityId');
    }

    return count || 0;
  }
}

export const participantRepository = new ParticipantRepository();
