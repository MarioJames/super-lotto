import { getSupabaseClient } from '../db/supabase';
import type { ParticipantRow, ParticipantInsert, ParticipantUpdate, ActivityParticipantRow, RoundRow, WinnerRow } from '../db/types';
import type { Participant, CreateParticipantDTO, UpdateParticipantDTO, ParticipantCSVRow, ImportResult } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

function rowToParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    name: row.name,
    employeeId: row.employee_id,
    department: row.department,
    email: row.email,
    createdAt: new Date(row.created_at),
  };
}

export class ParticipantRepository {
  async findById(id: number): Promise<Participant | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findById');
    }

    return data ? rowToParticipant(data as ParticipantRow) : null;
  }

  async findAll(): Promise<Participant[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('id');

    if (error) {
      throw parseSupabaseError(error, 'findAll');
    }

    return ((data || []) as ParticipantRow[]).map(rowToParticipant);
  }

  async findByEmployeeId(employeeId: string): Promise<Participant | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('employee_id', employeeId)
      .single();


    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseSupabaseError(error, 'findByEmployeeId');
    }

    return data ? rowToParticipant(data as ParticipantRow) : null;
  }

  async create(data: CreateParticipantDTO): Promise<Participant> {
    const supabase = getSupabaseClient();
    const insertData: ParticipantInsert = {
      name: data.name,
      employee_id: data.employeeId,
      department: data.department,
      email: data.email,
    };

    const { data: created, error } = await supabase
      .from('participants')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'create');
    }

    if (!created) {
      throw new DatabaseError('创建参与人员失败：未返回数据', 'create');
    }

    return rowToParticipant(created as ParticipantRow);
  }

  async update(id: number, data: UpdateParticipantDTO): Promise<Participant | null> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
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
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'update');
    }

    return updated ? rowToParticipant(updated as ParticipantRow) : null;
  }

  async delete(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const existing = await this.findById(id);
    if (!existing) return false;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, 'delete');
    }

    return true;
  }

  async findByActivityId(activityId: number): Promise<Participant[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activity_participants')
      .select('participant_id')
      .eq('activity_id', activityId);

    if (error) {
      throw parseSupabaseError(error, 'findByActivityId');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const participantIds = (data as Pick<ActivityParticipantRow, 'participant_id'>[]).map(row => row.participant_id);
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .in('id', participantIds)
      .order('id');

    if (participantsError) {
      throw parseSupabaseError(participantsError, 'findByActivityId');
    }

    return ((participants || []) as ParticipantRow[]).map(rowToParticipant);
  }


  async importFromCSV(data: ParticipantCSVRow[]): Promise<ImportResult> {
    const supabase = getSupabaseClient();
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || !row.employeeId || !row.department || !row.email) {
          result.failed++;
          result.errors.push({ row: i + 1, message: 'Missing required fields' });
          continue;
        }

        const insertData: ParticipantInsert = {
          name: row.name,
          employee_id: row.employeeId,
          department: row.department,
          email: row.email,
        };

        const { error } = await supabase
          .from('participants')
          .insert(insertData as never);

        if (error) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            message: error.message || 'Unknown error'
          });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  async findAvailableForRound(activityId: number, allowMultiWin: boolean): Promise<Participant[]> {
    const supabase = getSupabaseClient();

    if (allowMultiWin) {
      return this.findByActivityId(activityId);
    }

    // Get participants in the activity
    const { data: activityParticipants, error: apError } = await supabase
      .from('activity_participants')
      .select('participant_id')
      .eq('activity_id', activityId);

    if (apError) {
      throw parseSupabaseError(apError, 'findAvailableForRound');
    }

    if (!activityParticipants || activityParticipants.length === 0) {
      return [];
    }

    const participantIds = (activityParticipants as Pick<ActivityParticipantRow, 'participant_id'>[]).map(row => row.participant_id);

    // Get winners in this activity (through rounds)
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

    // Filter out winners
    const availableIds = participantIds.filter(id => !winnerParticipantIds.includes(id));

    if (availableIds.length === 0) {
      return [];
    }

    // Get participant details
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .in('id', availableIds)
      .order('id');

    if (participantsError) {
      throw parseSupabaseError(participantsError, 'findAvailableForRound');
    }

    return ((participants || []) as ParticipantRow[]).map(rowToParticipant);
  }
}

export const participantRepository = new ParticipantRepository();
