# Requirements Document

## Introduction

本规范定义了将抽奖系统的数据库从本地 SQLite3 (better-sqlite3) 迁移到 Supabase (PostgreSQL) 的需求。迁移将保持现有的数据模型和业务逻辑不变，同时利用 Supabase 提供的云端数据库服务，实现数据的持久化存储和多端访问能力。

## Glossary

- **Lottery System**: 抽奖系统，用于管理抽奖活动、参与人员和中奖记录的 Next.js 应用
- **Supabase**: 开源的 Firebase 替代方案，提供 PostgreSQL 数据库、认证、存储等服务
- **Repository Layer**: 数据访问层，封装数据库操作的代码模块
- **Participant**: 参与抽奖的人员
- **Activity**: 抽奖活动
- **Round**: 抽奖轮次，每个活动可包含多个轮次
- **Winner**: 中奖记录
- **Supabase Client**: Supabase 提供的 JavaScript/TypeScript SDK，用于与 Supabase 服务交互

## Requirements

### Requirement 1

**User Story:** As a developer, I want to configure Supabase connection, so that the application can connect to the Supabase database.

#### Acceptance Criteria

1. WHEN the application starts THEN the Lottery System SHALL establish a connection to Supabase using environment variables for configuration
2. WHEN Supabase credentials are missing or invalid THEN the Lottery System SHALL log a clear error message indicating the configuration issue
3. WHEN the Supabase connection is established THEN the Lottery System SHALL reuse the client instance across requests to avoid connection overhead

### Requirement 2

**User Story:** As a developer, I want to create the database schema in Supabase, so that the application has the required tables and relationships.

#### Acceptance Criteria

1. WHEN setting up the database THEN the Lottery System SHALL create a participants table with columns: id (serial primary key), name (text), employee_id (text unique), department (text), email (text), created_at (timestamptz)
2. WHEN setting up the database THEN the Lottery System SHALL create an activities table with columns: id (serial primary key), name (text), description (text), allow_multi_win (boolean), animation_duration_ms (integer), created_at (timestamptz), updated_at (timestamptz)
3. WHEN setting up the database THEN the Lottery System SHALL create a rounds table with columns: id (serial primary key), activity_id (integer foreign key), prize_name (text), prize_description (text), winner_count (integer), order_index (integer), lottery_mode (text), is_drawn (boolean), created_at (timestamptz)
4. WHEN setting up the database THEN the Lottery System SHALL create a winners table with columns: id (serial primary key), round_id (integer foreign key), participant_id (integer foreign key), drawn_at (timestamptz)
5. WHEN setting up the database THEN the Lottery System SHALL create an activity_participants junction table with columns: activity_id (integer), participant_id (integer), with a composite primary key
6. WHEN a parent record is deleted THEN the Lottery System SHALL cascade delete related child records through foreign key constraints

### Requirement 3

**User Story:** As a developer, I want to migrate the participant repository to use Supabase, so that participant data is stored in the cloud database.

#### Acceptance Criteria

1. WHEN creating a participant THEN the Lottery System SHALL insert the record into Supabase and return the created participant with generated id
2. WHEN querying participants THEN the Lottery System SHALL retrieve data from Supabase with proper type mapping
3. WHEN updating a participant THEN the Lottery System SHALL update the record in Supabase and return the updated participant
4. WHEN deleting a participant THEN the Lottery System SHALL remove the record from Supabase and return success status
5. WHEN importing participants from CSV THEN the Lottery System SHALL batch insert records into Supabase and report success and failure counts
6. WHEN querying available participants for a round THEN the Lottery System SHALL execute the appropriate Supabase query based on allow_multi_win setting

### Requirement 4

**User Story:** As a developer, I want to migrate the activity repository to use Supabase, so that activity data is stored in the cloud database.

#### Acceptance Criteria

1. WHEN creating an activity THEN the Lottery System SHALL insert the activity record and associated participant relationships into Supabase
2. WHEN querying an activity with rounds THEN the Lottery System SHALL retrieve the activity along with its rounds and participants from Supabase
3. WHEN updating an activity THEN the Lottery System SHALL update the record in Supabase and set updated_at to current timestamp
4. WHEN deleting an activity THEN the Lottery System SHALL remove the activity and cascade delete related rounds, winners, and participant associations
5. WHEN adding participants to an activity THEN the Lottery System SHALL insert records into the activity_participants junction table
6. WHEN removing participants from an activity THEN the Lottery System SHALL delete records from the activity_participants junction table

### Requirement 5

**User Story:** As a developer, I want to migrate the round repository to use Supabase, so that round data is stored in the cloud database.

#### Acceptance Criteria

1. WHEN creating a round THEN the Lottery System SHALL insert the record with auto-calculated order_index into Supabase
2. WHEN querying rounds by activity THEN the Lottery System SHALL retrieve rounds ordered by order_index from Supabase
3. WHEN updating a round THEN the Lottery System SHALL update the specified fields in Supabase
4. WHEN marking a round as drawn THEN the Lottery System SHALL update the is_drawn field to true in Supabase
5. WHEN reordering rounds THEN the Lottery System SHALL update order_index values for multiple rounds in Supabase

### Requirement 6

**User Story:** As a developer, I want to migrate the winner repository to use Supabase, so that winner data is stored in the cloud database.

#### Acceptance Criteria

1. WHEN recording winners THEN the Lottery System SHALL insert winner records into Supabase with current timestamp
2. WHEN querying winners by round THEN the Lottery System SHALL retrieve winners with participant and round details using Supabase joins
3. WHEN querying winners by activity THEN the Lottery System SHALL retrieve all winners across rounds ordered by round order_index
4. WHEN deleting winners by round THEN the Lottery System SHALL remove all winner records for the specified round from Supabase

### Requirement 7

**User Story:** As a developer, I want to remove SQLite dependencies, so that the application only uses Supabase for data storage.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the Lottery System SHALL remove better-sqlite3 and @types/better-sqlite3 from package.json
2. WHEN the migration is complete THEN the Lottery System SHALL delete the old SQLite database connection and schema files
3. WHEN the migration is complete THEN the Lottery System SHALL update all imports to use the new Supabase-based modules

### Requirement 8

**User Story:** As a developer, I want proper error handling for Supabase operations, so that database errors are handled gracefully.

#### Acceptance Criteria

1. WHEN a Supabase query fails THEN the Lottery System SHALL throw a descriptive error with the operation context
2. WHEN a unique constraint violation occurs THEN the Lottery System SHALL return an appropriate error message indicating the duplicate field
3. WHEN a foreign key constraint violation occurs THEN the Lottery System SHALL return an error message indicating the relationship issue
