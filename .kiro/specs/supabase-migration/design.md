# 设计文档

## 概述

本设计文档描述了将抽奖系统从 SQLite3 迁移到 Supabase 的技术方案。迁移采用渐进式策略，保持现有的 Repository 模式不变，仅替换底层数据访问实现。这种方式最大程度减少对上层业务逻辑的影响，同时利用 Supabase 的 PostgreSQL 数据库和 JavaScript SDK 实现云端数据存储。

## 架构

### 当前架构

```
┌─────────────────┐
│   API Routes    │
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │
└────────┬────────┘
         │
┌────────▼────────┐
│  better-sqlite3 │
└────────┬────────┘
         │
┌────────▼────────┐
│   SQLite DB     │
└─────────────────┘
```

### 目标架构

```
┌─────────────────┐
│   API Routes    │
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │
└────────┬────────┘
         │
┌────────▼────────┐
│ Supabase Client │
└────────┬────────┘
         │
┌────────▼────────┐
│ Supabase (PG)   │
└─────────────────┘
```

## 组件和接口

### 1. Supabase 客户端模块 (`src/lib/db/supabase.ts`)

负责创建和管理 Supabase 客户端实例。

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://ldobcwrfyengqrouqntp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY!;

// 单例客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

环境变量配置：
- `SUPABASE_KEY`: Supabase 项目的 anon key 或 service role key

### 2. 数据库类型定义 (`src/lib/db/types.ts`)

定义与 Supabase 表结构对应的 TypeScript 类型。

```typescript
export interface Database {
  public: {
    Tables: {
      participants: { Row: ParticipantRow; Insert: ParticipantInsert; Update: ParticipantUpdate };
      activities: { Row: ActivityRow; Insert: ActivityInsert; Update: ActivityUpdate };
      rounds: { Row: RoundRow; Insert: RoundInsert; Update: RoundUpdate };
      winners: { Row: WinnerRow; Insert: WinnerInsert; Update: WinnerUpdate };
      activity_participants: { Row: ActivityParticipantRow; Insert: ActivityParticipantInsert };
    };
  };
}
```

### 3. Repository 接口

保持现有 Repository 接口不变，仅修改实现：

- `ParticipantRepository` - 参与人员数据访问
- `ActivityRepository` - 活动数据访问
- `RoundRepository` - 轮次数据访问
- `WinnerRepository` - 中奖记录数据访问

## 数据模型

### PostgreSQL Schema

```sql
-- participants 表
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- activities 表
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  allow_multi_win BOOLEAN NOT NULL DEFAULT FALSE,
  animation_duration_ms INTEGER NOT NULL DEFAULT 60000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- rounds 表
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  prize_name TEXT NOT NULL,
  prize_description TEXT,
  winner_count INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  lottery_mode TEXT NOT NULL DEFAULT 'wheel',
  is_drawn BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- winners 表
CREATE TABLE winners (
  id SERIAL PRIMARY KEY,
  round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  drawn_at TIMESTAMPTZ DEFAULT NOW()
);

-- activity_participants 关联表
CREATE TABLE activity_participants (
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, participant_id)
);

-- 索引
CREATE INDEX idx_rounds_activity_id ON rounds(activity_id);
CREATE INDEX idx_winners_round_id ON winners(round_id);
CREATE INDEX idx_winners_participant_id ON winners(participant_id);
CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_participant ON activity_participants(participant_id);
```

### 类型映射

| SQLite 类型 | PostgreSQL 类型 | TypeScript 类型 |
|-------------|-----------------|-----------------|
| INTEGER PRIMARY KEY AUTOINCREMENT | SERIAL PRIMARY KEY | number |
| TEXT | TEXT | string |
| INTEGER (0/1) | BOOLEAN | boolean |
| DATETIME | TIMESTAMPTZ | Date |

## 正确性属性

*属性是指在系统所有有效执行中都应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

基于预分析，以下属性已被识别。经过反思后，冗余属性已被合并：

### 属性 1: Supabase 客户端单例
*对于任意*次数的 `getSupabaseClient()` 调用，该函数应返回相同的客户端实例。
**验证: 需求 1.3**

### 属性 2: 参与人员往返一致性
*对于任意*有效的参与人员数据，创建参与人员后通过 ID 查询，应返回字段值等价的参与人员（name、employeeId、department、email）。
**验证: 需求 3.1, 3.2**

### 属性 3: 参与人员更新一致性
*对于任意*已存在的参与人员和有效的更新数据，更新后查询应返回反映所有更新字段的参与人员。
**验证: 需求 3.3**

### 属性 4: 参与人员删除完整性
*对于任意*已存在的参与人员，删除后通过 ID 查询应返回 null。
**验证: 需求 3.4**

### 属性 5: CSV 导入计数不变量
*对于任意* CSV 行列表导入，成功计数与失败计数之和应等于输入行总数。
**验证: 需求 3.5**

### 属性 6: 可用参与人员排除规则
*对于任意* `allowMultiWin` 设置为 false 的活动，某轮次的可用参与人员不应包含该活动中已中奖的参与人员。
**验证: 需求 3.6**

### 属性 7: 活动往返一致性
*对于任意*有效的活动数据和参与人员 ID，创建活动后查询（含轮次）应返回字段值等价的活动和正确的参与人员关联。
**验证: 需求 4.1, 4.2**

### 属性 8: 活动更新时间戳
*对于任意*活动更新操作，更新后的 `updatedAt` 时间戳应大于或等于更新前的时间戳。
**验证: 需求 4.3**

### 属性 9: 活动级联删除
*对于任意*包含关联轮次和中奖记录的活动，删除活动后，通过该活动 ID 查询轮次和中奖记录应返回空结果。
**验证: 需求 4.4**

### 属性 10: 活动参与人员关联
*对于任意*活动和参与人员 ID 集合，添加参与人员后，活动的参与人员列表应包含所有添加的参与人员。移除参与人员后，活动的参与人员列表不应包含被移除的参与人员。
**验证: 需求 4.5, 4.6**

### 属性 11: 轮次顺序索引自增
*对于任意*活动，连续创建多个轮次时，每个新轮次的 `orderIndex` 应大于该活动中所有先前创建的轮次。
**验证: 需求 5.1**

### 属性 12: 轮次排序
*对于任意*包含多个轮次的活动，按活动 ID 查询轮次应返回按 `orderIndex` 升序排列的轮次。
**验证: 需求 5.2**

### 属性 13: 轮次更新一致性
*对于任意*已存在的轮次和有效的更新数据，更新后查询应返回反映所有更新字段的轮次。
**验证: 需求 5.3, 5.4**

### 属性 14: 轮次重排序一致性
*对于任意*活动和新的轮次 ID 排序，重排序后查询轮次应返回具有匹配新顺序的 `orderIndex` 值的轮次。
**验证: 需求 5.5**

### 属性 15: 中奖记录往返一致性
*对于任意*有效的轮次和参与人员，创建中奖记录后按轮次查询应包含该中奖记录及正确的参与人员和轮次详情。
**验证: 需求 6.1, 6.2**

### 属性 16: 活动中奖记录排序
*对于任意*包含多个轮次和中奖记录的活动，按活动查询中奖记录应返回按轮次 `orderIndex` 排序的中奖记录。
**验证: 需求 6.3**

### 属性 17: 按轮次删除中奖记录
*对于任意*包含中奖记录的轮次，按轮次 ID 删除中奖记录后，查询该轮次的中奖记录应返回空列表。
**验证: 需求 6.4**

## 错误处理

### 错误类型

```typescript
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(
    public readonly field: string,
    operation: string,
    cause?: Error
  ) {
    super(`字段值重复: ${field}`, operation, cause);
    this.name = 'UniqueConstraintError';
  }
}

export class ForeignKeyError extends DatabaseError {
  constructor(
    public readonly relationship: string,
    operation: string,
    cause?: Error
  ) {
    super(`无效引用: ${relationship}`, operation, cause);
    this.name = 'ForeignKeyError';
  }
}
```

### 错误处理策略

1. **Supabase 错误检测**: 检查 Supabase 响应中的 `error` 字段
2. **错误分类**: 根据 PostgreSQL 错误码分类错误类型
   - `23505`: 唯一约束违反 → `UniqueConstraintError`
   - `23503`: 外键约束违反 → `ForeignKeyError`
   - 其他: 通用 `DatabaseError`
3. **错误传播**: 将分类后的错误向上层传播，保留原始错误信息

## 测试策略

### 属性测试

使用 `fast-check` 库进行属性测试。每个属性测试将运行至少 100 次迭代。

```typescript
import fc from 'fast-check';
```

### 测试类别

1. **单元测试**: 测试各个 Repository 方法的基本功能
2. **属性测试**: 验证上述正确性属性
3. **集成测试**: 测试与真实 Supabase 实例的集成（可选，需要测试环境）

### 测试环境

- 使用 Supabase 本地开发环境或测试项目进行测试
- 每个测试套件前清理测试数据
- 使用事务或测试数据隔离确保测试独立性

### 属性测试注释格式

每个属性测试必须使用以下格式注释：
```typescript
// **Feature: supabase-migration, Property {number}: {property_text}**
// **验证: 需求 X.Y**
```
