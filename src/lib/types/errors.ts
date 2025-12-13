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
  public readonly operation: string;
  public readonly cause?: Error;

  constructor(message: string, operation: string, cause?: Error) {
    super(message, 'DATABASE_ERROR', {
      operation,
      originalError: cause?.message
    });
    this.name = 'DatabaseError';
    this.operation = operation;
    this.cause = cause;
  }
}

// 唯一约束违反错误
export class UniqueConstraintError extends DatabaseError {
  public readonly field: string;

  constructor(field: string, operation: string, cause?: Error) {
    super(`字段值重复: ${field}`, operation, cause);
    this.name = 'UniqueConstraintError';
    this.code = 'UNIQUE_CONSTRAINT_ERROR';
    this.field = field;
  }
}

// 外键约束违反错误
export class ForeignKeyError extends DatabaseError {
  public readonly relationship: string;

  constructor(relationship: string, operation: string, cause?: Error) {
    super(`无效引用: ${relationship}`, operation, cause);
    this.name = 'ForeignKeyError';
    this.code = 'FOREIGN_KEY_ERROR';
    this.relationship = relationship;
  }
}

/**
 * 解析 Supabase/PostgreSQL 错误并返回适当的错误类型
 * PostgreSQL 错误码:
 * - 23505: 唯一约束违反
 * - 23503: 外键约束违反
 */
export function parseSupabaseError(
  error: { code?: string; message?: string; details?: string },
  operation: string
): DatabaseError {
  const pgError = error as { code?: string; message?: string; details?: string };

  if (pgError.code === '23505') {
    // 尝试从错误消息中提取字段名
    const fieldMatch = pgError.message?.match(/Key \((\w+)\)/);
    const field = fieldMatch ? fieldMatch[1] : 'unknown';
    return new UniqueConstraintError(field, operation, new Error(pgError.message));
  }

  if (pgError.code === '23503') {
    // 尝试从错误消息中提取关系名
    const relationMatch = pgError.message?.match(/table "(\w+)"/);
    const relationship = relationMatch ? relationMatch[1] : 'unknown';
    return new ForeignKeyError(relationship, operation, new Error(pgError.message));
  }

  return new DatabaseError(
    pgError.message || '数据库操作失败',
    operation,
    new Error(pgError.message)
  );
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

// 禁止访问错误
export class ForbiddenError extends LotteryError {
  constructor(message: string) {
    super(message, 'FORBIDDEN', {});
    this.name = 'ForbiddenError';
  }
}
