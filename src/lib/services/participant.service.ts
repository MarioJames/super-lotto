import { parse } from 'csv-parse/sync';
import { participantRepository } from '../repositories';
import type { Participant, CreateParticipantDTO, UpdateParticipantDTO, ParticipantCSVRow, ImportResult } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class ParticipantService {
  async listParticipants(): Promise<Participant[]> {
    return participantRepository.findAll();
  }

  async getParticipant(id: number): Promise<Participant> {
    const participant = await participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundError('Participant', id);
    }
    return participant;
  }

  async addParticipant(data: CreateParticipantDTO): Promise<Participant> {
    this.validateParticipantData(data);

    // 检查工号是否已存在
    const existing = await participantRepository.findByEmployeeId(data.employeeId);
    if (existing) {
      throw new ValidationError('Employee ID already exists', { employeeId: data.employeeId });
    }

    return participantRepository.create(data);
  }

  async updateParticipant(id: number, data: UpdateParticipantDTO): Promise<Participant> {
    const existing = await participantRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Participant', id);
    }

    // 如果更新工号，检查是否与其他人重复
    if (data.employeeId && data.employeeId !== existing.employeeId) {
      const duplicate = await participantRepository.findByEmployeeId(data.employeeId);
      if (duplicate) {
        throw new ValidationError('Employee ID already exists', { employeeId: data.employeeId });
      }
    }

    const updated = await participantRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Participant', id);
    }
    return updated;
  }


  async deleteParticipant(id: number): Promise<boolean> {
    const existing = await participantRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Participant', id);
    }
    return participantRepository.delete(id);
  }

  async importParticipantsFromCSV(csvContent: string): Promise<ImportResult> {
    let records: ParticipantCSVRow[];

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      return {
        success: 0,
        failed: 0,
        errors: [{ row: 0, message: 'Invalid CSV format' }],
      };
    }

    // 映射列名（支持中英文）
    const mappedRecords: ParticipantCSVRow[] = (records as unknown as Record<string, string>[]).map((record) => ({
      name: record.name || record['姓名'] || '',
      employeeId: record.employeeId || record.employee_id || record['工号'] || '',
      department: record.department || record['部门'] || '',
      email: record.email || record['邮箱'] || '',
    }));

    return participantRepository.importFromCSV(mappedRecords);
  }

  private validateParticipantData(data: CreateParticipantDTO): void {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Name is required');
    }
    if (!data.employeeId || data.employeeId.trim() === '') {
      throw new ValidationError('Employee ID is required');
    }
    if (!data.department || data.department.trim() === '') {
      throw new ValidationError('Department is required');
    }
    if (!data.email || data.email.trim() === '') {
      throw new ValidationError('Email is required');
    }
    // 简单的邮箱格式验证
    if (!data.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
  }
}

export const participantService = new ParticipantService();
