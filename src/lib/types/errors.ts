// 基础错误类
export class LotteryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LotteryError';
  }
}

// 验证错误
export class ValidationError extends LotteryError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// 未找到错误
export class NotFoundError extends LotteryError {
  constructor(entity: string, id: number | string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}

// 参与人员不足错误
export class InsufficientParticipantsError extends LotteryError {
  constructor(required: number, available: number) {
    super(
      `Insufficient participants: required ${required}, available ${available}`,
      'INSUFFICIENT_PARTICIPANTS',
      { required, available }
    );
    this.name = 'InsufficientParticipantsError';
  }
}

// 数据库错误
export class DatabaseError extends LotteryError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', { originalError: originalError?.message });
    this.name = 'DatabaseError';
  }
}

// CSV 解析错误
export class CSVParseError extends LotteryError {
  constructor(row: number, message: string) {
    super(`CSV parse error at row ${row}: ${message}`, 'CSV_PARSE_ERROR', { row });
    this.name = 'CSVParseError';
  }
}

// 已抽奖错误
export class AlreadyDrawnError extends LotteryError {
  constructor(roundId: number) {
    super(`Round ${roundId} has already been drawn`, 'ALREADY_DRAWN', { roundId });
    this.name = 'AlreadyDrawnError';
  }
}
