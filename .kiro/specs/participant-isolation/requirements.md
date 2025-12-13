# Requirements Document

## Introduction

本功能旨在重构抽奖系统的参与人员管理方式和抽奖配置结构。主要变更包括：
1. 移除独立的参与人员管理功能，将CSV导入功能整合到活动创建流程中
2. 实现不同活动的参与人员完全隔离
3. 将抽奖动画时长配置从活动级别移动到轮次级别

## Glossary

- **Activity（活动）**: 一次抽奖活动，包含名称、描述、配置和参与人员
- **Participant（参与人员）**: 参与抽奖的人员，包含姓名、工号、部门、邮箱等信息
- **Round（轮次）**: 活动中的一轮抽奖，包含奖品信息、中奖人数、抽奖模式和动画时长
- **CSV Import（CSV导入）**: 通过CSV文件批量导入参与人员的功能
- **Activity-Scoped Participant（活动级参与人员）**: 仅属于特定活动的参与人员，与其他活动完全隔离
- **Animation Duration（动画时长）**: 抽奖动画播放的时间长度

## Requirements

### Requirement 1

**User Story:** As a 活动管理员, I want to 在创建活动时通过CSV导入参与人员, so that 简化活动创建流程并确保人员数据与活动绑定。

#### Acceptance Criteria

1. WHEN 用户打开创建活动弹窗 THEN THE 系统 SHALL 显示CSV文件导入区域和模板下载链接
2. WHEN 用户点击下载模板 THEN THE 系统 SHALL 提供包含正确列头的CSV模板文件
3. WHEN 用户上传CSV文件 THEN THE 系统 SHALL 解析文件并在弹窗中预览导入的人员列表
4. WHEN CSV文件包含有效的姓名字段 THEN THE 系统 SHALL 成功解析该行数据
5. WHEN CSV文件中姓名字段为空 THEN THE 系统 SHALL 跳过该行并记录错误
6. WHEN 用户确认创建活动 THEN THE 系统 SHALL 将导入的人员与该活动关联存储
7. WHEN 用户未上传任何有效人员数据 THEN THE 系统 SHALL 阻止活动创建并提示需要导入人员

### Requirement 2

**User Story:** As a 活动管理员, I want to 每个活动的参与人员相互隔离, so that 不同活动的人员数据互不影响。

#### Acceptance Criteria

1. WHEN 活动A的参与人员被导入 THEN THE 系统 SHALL 确保这些人员仅在活动A中可见
2. WHEN 查询活动的参与人员 THEN THE 系统 SHALL 仅返回属于该活动的人员
3. WHEN 活动被删除 THEN THE 系统 SHALL 同时删除该活动的所有参与人员数据
4. WHEN 同一人员信息在不同活动中导入 THEN THE 系统 SHALL 为每个活动创建独立的人员记录

### Requirement 3

**User Story:** As a 系统用户, I want to 系统移除独立的参与人员管理页面, so that 简化系统结构并避免数据管理混乱。

#### Acceptance Criteria

1. WHEN 用户访问系统 THEN THE 系统 SHALL 不显示独立的"参与人员"导航菜单项
2. WHEN 用户尝试访问 /participants 路径 THEN THE 系统 SHALL 重定向到活动列表页面
3. WHEN 系统启动 THEN THE 系统 SHALL 不加载全局参与人员管理相关的API端点

### Requirement 4

**User Story:** As a 活动管理员, I want to 在活动详情页管理该活动的参与人员, so that 可以在活动创建后继续维护人员列表。

#### Acceptance Criteria

1. WHEN 用户进入活动详情页 THEN THE 系统 SHALL 显示该活动的参与人员列表
2. WHEN 用户在活动详情页点击导入 THEN THE 系统 SHALL 允许通过CSV追加导入新的参与人员
3. WHEN 用户删除活动中的某个参与人员 THEN THE 系统 SHALL 从该活动中移除该人员记录

### Requirement 5

**User Story:** As a 开发者, I want to 数据库结构支持活动级人员隔离, so that 数据存储符合新的业务模型。

#### Acceptance Criteria

1. WHEN 参与人员被创建 THEN THE 系统 SHALL 在数据库中记录该人员所属的活动ID
2. WHEN 查询参与人员 THEN THE 系统 SHALL 通过活动ID进行过滤
3. WHEN 执行数据迁移 THEN THE 系统 SHALL 保留现有活动与参与人员的关联关系
4. WHEN 删除活动 THEN THE 系统 SHALL 级联删除该活动的所有参与人员记录

### Requirement 6

**User Story:** As a 活动管理员, I want to 在每轮抽奖中单独配置动画时长, so that 不同奖项可以有不同的抽奖效果展示时间。

#### Acceptance Criteria

1. WHEN 用户创建抽奖轮次 THEN THE 系统 SHALL 显示动画时长配置选项
2. WHEN 用户编辑抽奖轮次 THEN THE 系统 SHALL 允许修改该轮次的动画时长
3. WHEN 执行抽奖 THEN THE 系统 SHALL 使用该轮次配置的动画时长
4. WHEN 用户未指定动画时长 THEN THE 系统 SHALL 使用默认值60秒
5. WHEN 活动配置中的动画时长字段 THEN THE 系统 SHALL 移除该字段

