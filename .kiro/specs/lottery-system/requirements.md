# Requirements Document

## Introduction

本文档定义了一个多功能抽奖系统的需求规格。该系统支持多种创意抽奖模式（双色球、刮刮乐、祖玛、赛马等），提供完整的参与人员管理、抽奖活动配置、奖品轮次设置以及中奖结果导出功能。系统使用 SQLite 作为本地数据库存储数据。

## Glossary

- **Lottery_System**: 抽奖系统，负责管理抽奖活动、参与人员和中奖结果的核心应用
- **Participant**: 参与人员，可以参加抽奖活动的用户
- **Activity**: 抽奖活动，包含多个抽奖轮次的活动实体
- **Round**: 抽奖轮次，活动中的单次抽奖，包含奖品信息和中奖人数配置
- **Prize**: 奖品，抽奖轮次中设置的奖励物品
- **Winner**: 中奖人员，在某轮次中被抽中的参与人员
- **Lottery_Mode**: 抽奖模式，不同的抽奖展示和交互方式
- **Multi_Win_Config**: 多次中奖配置，控制参与人员是否可以在同一活动中多次中奖

## Requirements

### Requirement 1

**User Story:** As a 活动管理员, I want to 导入和管理参与人员名单, so that 我可以维护抽奖活动的参与者池。

#### Acceptance Criteria

1. WHEN 管理员上传包含参与人员信息的 CSV 文件 THEN Lottery_System SHALL 解析文件内容并将有效的参与人员记录存储到数据库
2. WHEN 管理员添加单个参与人员 THEN Lottery_System SHALL 创建新的参与人员记录并分配唯一标识符
3. WHEN 管理员编辑参与人员信息 THEN Lottery_System SHALL 更新对应的参与人员记录
4. WHEN 管理员删除参与人员 THEN Lottery_System SHALL 从数据库中移除该参与人员记录
5. WHEN 管理员查询参与人员列表 THEN Lottery_System SHALL 返回所有参与人员的信息列表
6. WHEN CSV 文件包含无效数据行 THEN Lottery_System SHALL 跳过无效行并记录错误信息，继续处理有效数据

### Requirement 2

**User Story:** As a 活动管理员, I want to 配置多次中奖规则, so that 我可以控制参与人员在同一活动中是否可以重复中奖。

#### Acceptance Criteria

1. WHEN 管理员创建抽奖活动时设置多次中奖为启用 THEN Lottery_System SHALL 允许同一参与人员在该活动的不同轮次中多次中奖
2. WHEN 管理员创建抽奖活动时设置多次中奖为禁用 THEN Lottery_System SHALL 在后续轮次中排除已中奖的参与人员
3. WHEN 执行抽奖且多次中奖禁用时 THEN Lottery_System SHALL 仅从未中奖的参与人员池中选择中奖者

### Requirement 3

**User Story:** As a 活动管理员, I want to 创建和管理抽奖活动, so that 我可以组织不同的抽奖场景。

#### Acceptance Criteria

1. WHEN 管理员创建新抽奖活动 THEN Lottery_System SHALL 存储活动名称、描述、抽奖模式和多次中奖配置
2. WHEN 管理员查询活动列表 THEN Lottery_System SHALL 返回所有抽奖活动的摘要信息
3. WHEN 管理员查询单个活动详情 THEN Lottery_System SHALL 返回该活动的完整信息包括所有轮次配置
4. WHEN 管理员更新活动信息 THEN Lottery_System SHALL 修改对应的活动记录
5. WHEN 管理员删除活动 THEN Lottery_System SHALL 移除该活动及其关联的所有轮次和中奖记录

### Requirement 4

**User Story:** As a 活动管理员, I want to 配置抽奖轮次, so that 我可以为每个活动设置多个奖品级别和中奖人数。

#### Acceptance Criteria

1. WHEN 管理员为活动添加抽奖轮次 THEN Lottery_System SHALL 创建包含奖品名称、奖品描述、中奖人数的轮次记录
2. WHEN 管理员编辑轮次配置 THEN Lottery_System SHALL 更新对应的轮次信息
3. WHEN 管理员删除轮次 THEN Lottery_System SHALL 移除该轮次及其关联的中奖记录
4. WHEN 管理员查询活动的所有轮次 THEN Lottery_System SHALL 返回按顺序排列的轮次列表
5. WHEN 配置的中奖人数超过可用参与人员数量 THEN Lottery_System SHALL 返回错误提示并拒绝执行抽奖

### Requirement 5

**User Story:** As a 活动管理员, I want to 执行抽奖并记录结果, so that 我可以公平地选出中奖者并保存记录。

#### Acceptance Criteria

1. WHEN 管理员执行某轮次抽奖 THEN Lottery_System SHALL 使用随机算法从参与人员池中选出指定数量的中奖者
2. WHEN 抽奖完成 THEN Lottery_System SHALL 将中奖结果存储到数据库并关联到对应轮次
3. WHEN 管理员查询某轮次的中奖结果 THEN Lottery_System SHALL 返回该轮次所有中奖人员的信息
4. WHEN 管理员导出中奖结果 THEN Lottery_System SHALL 生成包含活动名称、轮次、奖品、中奖人员信息的 CSV 文件

### Requirement 6

**User Story:** As a 活动管理员, I want to 选择不同的抽奖模式, so that 我可以为不同场景提供有趣的抽奖体验。

#### Acceptance Criteria

1. WHEN 管理员选择双色球模式执行抽奖 THEN Lottery_System SHALL 模拟双色球开奖动画，依次显示每个中奖者对应的号码球
2. WHEN 管理员选择刮刮乐模式执行抽奖 THEN Lottery_System SHALL 显示可刮开的卡片界面，刮开后显示中奖者信息
3. WHEN 管理员选择祖玛模式执行抽奖 THEN Lottery_System SHALL 显示旋转的球链动画，球停止时显示中奖者
4. WHEN 管理员选择赛马模式执行抽奖 THEN Lottery_System SHALL 显示赛马竞速动画，到达终点的顺序决定中奖者
5. WHEN 管理员选择转盘模式执行抽奖 THEN Lottery_System SHALL 显示旋转轮盘动画，指针停止位置决定中奖者
6. WHEN 管理员选择老虎机模式执行抽奖 THEN Lottery_System SHALL 显示三列滚动动画，停止后匹配的图案对应中奖者

### Requirement 7

**User Story:** As a 系统用户, I want to 通过命令行界面操作系统, so that 我可以方便地管理抽奖活动。

#### Acceptance Criteria

1. WHEN 用户启动系统 THEN Lottery_System SHALL 显示主菜单包含参与人员管理、活动管理、执行抽奖、导出结果等选项
2. WHEN 用户选择菜单选项 THEN Lottery_System SHALL 导航到对应的功能界面
3. WHEN 用户输入无效命令 THEN Lottery_System SHALL 显示错误提示并重新显示可用选项
4. WHEN 操作完成 THEN Lottery_System SHALL 显示操作结果并返回上级菜单

### Requirement 8

**User Story:** As a 开发者, I want to 系统数据持久化到 SQLite 数据库, so that 所有数据可以安全存储和检索。

#### Acceptance Criteria

1. WHEN 系统首次启动 THEN Lottery_System SHALL 创建 SQLite 数据库文件和所有必要的表结构
2. WHEN 执行数据写入操作 THEN Lottery_System SHALL 使用事务确保数据一致性
3. WHEN 数据库操作失败 THEN Lottery_System SHALL 回滚事务并返回明确的错误信息
4. WHEN 系统重启 THEN Lottery_System SHALL 从数据库恢复所有之前保存的数据
