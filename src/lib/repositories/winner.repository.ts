import { getSupabaseClient } from '../db/supabase';
import type { WinnerRow, WinnerInsert, ParticipantRow, RoundRow } from '../db/types';
import type { Winner, WinnerWithDetails, Participant, Round, LotteryMode } from '../types';
import { parseSupabaseError, DatabaseError } from '../types/errors';

function rowToWinner(row: WinnerRow): Winner {
  return {
    id: row.id,
    roundId: row.round_id,
    participantId: row.participant_id,
    drawnAt: new Date(row.drawn_at),
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

interface WinnerWithJoins {
  id: number;
  round_id: number;
  participant_id: number;
  drawn_at: string;
  participants: ParticipantRow;
  rounds: RoundRow;
}

function joinedRowToWinnerWithDetails(row: WinnerWithJoins): WinnerWithDetails {
  return {
    id: row.id,
    roundId: row.round_id,
    participantId: row.participant_id,
    drawnAt: new Date(row.drawn_at),
    participant: rowToParticipant(row.participants),
    round: rowToRound(row.rounds),
  };
}

export class WinnerRepository {
  async create(roundId: number, participantId: number): Promise<Winner> {
    const supabase = getSupabaseClient();
    const insertData: WinnerInsert = {
      round_id: roundId,
      participant_id: participantId,
    };

    const { data, error } = await supabase
      .from('winners')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      throw parseSupabaseError(error, 'create');
    }

    if (!data) {
      throw new DatabaseError('创建中奖记录失败：未返回数据', 'create');
    }

    return rowToWinner(data as WinnerRow);
  }

  async createMany(roundId: number, participantIds: number[]): Promise<Winner[]> {
    const supabase = getSupabaseClient();

    if (participantIds.length === 0) {
      return [];
    }

    const insertData: WinnerInsert[] = participantIds.map(participantId => ({
      round_id: roundId,
      participant_id: participantId,
    }));

    const { data, error } = await supabase
      .from('winners')
      .insert(insertData as never[])
      .select();

    if (error) {
      throw parseSupabaseError(error, 'createMany');
    }

    if (!data) {
      throw new DatabaseError('批量创建中奖记录失败：未返回数据', 'createMany');
    }

    return (data as WinnerRow[]).map(rowToWinner);
  }

  async findByRoundId(roundId: number): Promise<WinnerWithDetails[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        round_id,
        participant_id,
        drawn_at,
        participants (*),
        rounds (*)
      `)
      .eq('round_id', roundId)
      .order('id');

    if (error) {
      throw parseSupabaseError(error, 'findByRoundId');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as unknown as WinnerWithJoins[]).map(joinedRowToWinnerWithDetails);
  }

  async findByActivityId(activityId: number): Promise<WinnerWithDetails[]> {
    const supabase = getSupabaseClient();

    // First get all rounds for this activity to get their IDs
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('id, order_index')
      .eq('activity_id', activityId)
      .order('order_index');

    if (roundsError) {
      throw parseSupabaseError(roundsError, 'findByActivityId');
    }

    if (!rounds || rounds.length === 0) {
      return [];
    }

    const roundIds = (rounds as Pick<RoundRow, 'id' | 'order_index'>[]).map(r => r.id);

    // Get winners with joins
    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        round_id,
        participant_id,
        drawn_at,
        participants (*),
        rounds (*)
      `)
      .in('round_id', roundIds)
      .order('id');

    if (error) {
      throw parseSupabaseError(error, 'findByActivityId');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const winners = (data as unknown as WinnerWithJoins[]).map(joinedRowToWinnerWithDetails);

    // Sort by round order_index, then by winner id
    winners.sort((a, b) => {
      if (a.round.orderIndex !== b.round.orderIndex) {
        return a.round.orderIndex - b.round.orderIndex;
      }
      return a.id - b.id;
    });

    return winners;
  }

  async findByParticipantId(participantId: number): Promise<Winner[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('winners')
      .select('*')
      .eq('participant_id', participantId)
      .order('id');

    if (error) {
      throw parseSupabaseError(error, 'findByParticipantId');
    }

    return ((data || []) as WinnerRow[]).map(rowToWinner);
  }

  async deleteByRoundId(roundId: number): Promise<number> {
    const supabase = getSupabaseClient();

    // First count how many records will be deleted
    const { data: existing, error: countError } = await supabase
      .from('winners')
      .select('id')
      .eq('round_id', roundId);

    if (countError) {
      throw parseSupabaseError(countError, 'deleteByRoundId');
    }

    const count = existing?.length || 0;

    if (count === 0) {
      return 0;
    }

    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('round_id', roundId);

    if (error) {
      throw parseSupabaseError(error, 'deleteByRoundId');
    }

    return count;
  }
}

export const winnerRepository = new WinnerRepository();
