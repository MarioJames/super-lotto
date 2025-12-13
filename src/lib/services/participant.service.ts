import { parse } from 'csv-parse/sync';
import { participantRepository } from '../repositories';
import type { Participant, ParticipantCSVRow, ImportResult } from '../types';
import { ValidationError, NotFoundError, ForbiddenError } from '../types/errors';

/**
 * CSV 列名映射 - 支持中英文列名
 */
function mapCSVRecord(record: Record<string, string>): ParticipantCSVRow {
  return {
    name: record.name || record['姓名'] || '',
    employeeId: record.employeeId || record.employee_id || record['工号'] || '',
    department: record.department || record['部门'] || '',
    email: record.email || record['邮箱'] || '',
  };
}

/**
 * 将参与人员数据序列化为 CSV 格式
 */
export function serializeToCSV(participants: ParticipantCSVRow[]): string {
  const header = '姓名,工号,部门,邮箱';
  const rows = participants.map(p =>
    `${p.name},${p.employeeId || ''},${p.department || ''},${p.email || ''}`
  );
  return [header, ...rows].join('\n');
}

/**
 * 解析 CSV 内容为参与人员数据
 */
export function parseCSVContent(csvContent: string): { records: ParticipantCSVRow[]; errors: Array<{ row: number; message: string }> } {
  const errors: Array<{ row: number; message: string }> = [];
  let rawRecords: Record<string, string>[];

  try {
    rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return {
      records: [],
      errors: [{ row: 0, message: '无效的CSV格式' }],
    };
  }

  const records: ParticipantCSVRow[] = [];

  for (let i = 0; i < rawRecords.length; i++) {
    const mapped = mapCSVRecord(rawRecords[i]);

    // 仅姓名必填 - Requirements 1.4, 1.5
    if (!mapped.name || mapped.name.trim() === '') {
      errors.push({ row: i + 1, message: `第${i + 1}行：姓名不能为空` });
      continue;
    }

    records.push({
      name: mapped.name.trim(),
      employeeId: mapped.employeeId?.trim() || '',
      department: mapped.department?.trim() || '',
      email: mapped.email?.trim() || '',
    });
  }

  return { records, errors };
}

export class ParticipantService {
  /**
   * 获取活动的参与人员列表
   */
  async listParticipantsForActivity(activityId: number): Promise<Participant[]> {
    return participantRepository.findByActivityId(activityId);
  }

  /**
   * 获取活动中的单个参与人员
   */
  async getParticipantFromActivity(activityId: number, participantId: number): Promise<Participant> {
    const participant = await participantRepository.findById(activityId, participantId);
    if (!participant) {
      throw new NotFoundError('Participant', participantId);
    }
    return participant;
  }

  /**
   * 为活动导入参与人员（从 CSV 内容）
   * Requirements: 1.3, 1.4, 1.5, 4.2
   */
  async importParticipantsForActivity(activityId: number, csvContent: string): Promise<ImportResult> {
    // 解析 CSV 内容
    const { records, errors } = parseCSVContent(csvContent);

    if (errors.length > 0 && errors[0].message === '无效的CSV格式') {
      return {
        success: 0,
        failed: 0,
        errors,
      };
    }

    if (records.length === 0 && errors.length === 0) {
      return {
        success: 0,
        failed: 0,
        errors: [{ row: 0, message: 'CSV文件为空' }],
      };
    }

    // 导入有效记录到数据库
    const importResult = await participantRepository.importForActivity(activityId, records);

    // 合并解析错误和导入错误
    return {
      success: importResult.success,
      failed: importResult.failed + errors.length,
      errors: [...errors, ...importResult.errors],
    };
  }

  /**
   * 从活动中删除参与人员
   * Requirements: 4.3
   */
  async deleteParticipantFromActivity(activityId: number, participantId: number): Promise<boolean> {
    // 先检查参与人员是否存在于该活动
    const participant = await participantRepository.findById(activityId, participantId);
    if (!participant) {
      throw new NotFoundError('Participant', participantId);
    }

    // 确保参与人员属于该活动
    if (participant.activityId !== activityId) {
      throw new ForbiddenError('参与人员不属于该活动');
    }

    return participantRepository.deleteFromActivity(activityId, participantId);
  }

  /**
   * 获取活动的参与人员数量
   */
  async countParticipantsForActivity(activityId: number): Promise<number> {
    return participantRepository.countByActivityId(activityId);
  }
}

export const participantService = new ParticipantService();
