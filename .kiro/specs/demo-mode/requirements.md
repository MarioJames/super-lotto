# Requirements Document

## Introduction

演示模式功能允许用户在首页快速体验抽奖系统的动画效果，无需创建活动或导入参与人员。系统将随机生成模拟参与者数据，并随机选择一种抽奖模式展示完整的抽奖动画流程，帮助用户直观了解各种抽奖模式的视觉效果。

## Glossary

- **Demo_Mode**: 演示模式，一种无需真实数据即可展示抽奖动画效果的功能
- **Mock_Participant**: 模拟参与者，系统随机生成的虚拟抽奖人员数据
- **Lottery_Mode**: 抽奖模式，包括双色球、刮刮乐、祖玛、赛马、转盘、老虎机六种动画效果
- **Home_Page**: 首页，系统的主入口页面

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to quickly preview lottery animations on the home page, so that I can understand the visual effects before creating an actual activity.

#### Acceptance Criteria

1. WHEN a user clicks the demo button on the home page THEN the Demo_Mode SHALL display a lottery animation modal with randomly generated Mock_Participants
2. WHEN the Demo_Mode starts THEN the system SHALL generate between 10 and 30 Mock_Participants with realistic Chinese names and department information
3. WHEN the Demo_Mode starts THEN the system SHALL randomly select one Lottery_Mode from the six available modes (双色球、刮刮乐、祖玛、赛马、转盘、老虎机)
4. WHEN the lottery animation completes THEN the Demo_Mode SHALL display the randomly selected winners with celebration effects

### Requirement 2

**User Story:** As a visitor, I want the demo to feel realistic, so that I can accurately evaluate whether the lottery system meets my needs.

#### Acceptance Criteria

1. WHEN Mock_Participants are generated THEN the system SHALL create participants with unique IDs, Chinese names, and department names
2. WHEN the demo lottery runs THEN the system SHALL randomly select 1 to 3 winners from the Mock_Participants
3. WHEN the demo animation plays THEN the system SHALL use the same animation duration and effects as real lottery draws

### Requirement 3

**User Story:** As a visitor, I want to easily access and exit the demo mode, so that I can explore the feature without disruption.

#### Acceptance Criteria

1. WHEN the Home_Page loads THEN the system SHALL display a prominent demo button in the hero section
2. WHEN the demo modal is open THEN the system SHALL provide a close button to exit the demo
3. WHEN the demo animation completes THEN the system SHALL allow the user to either close the modal or run another demo with a different mode
4. WHEN the user clicks outside the modal or presses Escape THEN the system SHALL close the demo modal

### Requirement 4

**User Story:** As a visitor, I want to try different lottery modes, so that I can compare and choose the best one for my event.

#### Acceptance Criteria

1. WHEN the demo completes THEN the system SHALL display a "Try Another Mode" button
2. WHEN the user clicks "Try Another Mode" THEN the system SHALL randomly select a different Lottery_Mode and regenerate Mock_Participants
3. WHEN running multiple demos THEN the system SHALL attempt to show different modes to maximize variety
