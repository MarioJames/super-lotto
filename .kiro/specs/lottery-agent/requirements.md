# Requirements Document

## Introduction

本文档定义了一个基于聊天机器人交互形式的抽奖智能体系统。该系统允许用户通过自然语言与 AI 助手交互，完成参与人员导入、抽奖轮次配置和抽奖执行等功能。系统支持自定义组件渲染、流式响应和数据持久化。

## Glossary

- **Lottery_Agent**: 抽奖智能体系统，负责处理用户交互和抽奖逻辑
- **Chat_Interface**: 聊天界面组件，用于展示消息和自定义卡片
- **Welcome_Card**: 欢迎卡片组件，在用户首次进入时展示
- **Participant**: 参与抽奖的人员，包含姓名等基本信息
- **Lottery_Round**: 抽奖轮次，包含轮次序号、奖品名称和奖品数量
- **Winner**: 中奖人员，包含参与者信息和所获奖品
- **CSV_Parser**: CSV 文件解析器，在服务端解析上传的参与人员文件
- **LLM**: 大语言模型，用于自然语言理解和表述优化
- **Stream_Response**: 流式响应，实时渲染 AI 返回的内容

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a welcome card when I first enter the page, so that I can understand how to use the lottery system.

#### Acceptance Criteria

1. WHEN a user visits the lottery page for the first time THEN the Lottery_Agent SHALL display a Welcome_Card with greeting message and action buttons
2. WHEN a user clicks the "How to Use" button on the Welcome_Card THEN the Lottery_Agent SHALL display a modal dialog explaining the system usage instructions
3. WHEN the Welcome_Card is rendered THEN the Lottery_Agent SHALL include buttons for common actions such as viewing instructions and starting the lottery process

### Requirement 2

**User Story:** As a user, I want to upload a CSV file containing participant information, so that I can import lottery participants efficiently.

#### Acceptance Criteria

1. WHEN a user uploads a CSV file THEN the Lottery_Agent SHALL parse the file on the server side and extract participant data
2. WHEN the CSV file is successfully parsed THEN the Lottery_Agent SHALL send the participant data to the LLM for description optimization
3. WHEN the LLM returns the optimized description THEN the Lottery_Agent SHALL display the participant summary using Stream_Response for user confirmation
4. WHEN a user confirms the participant data THEN the Lottery_Agent SHALL store the Participant list in local storage
5. IF the CSV file format is invalid THEN the Lottery_Agent SHALL display an error message describing the format requirements

### Requirement 3

**User Story:** As a user, I want to configure lottery rounds through natural language input, so that I can set up prizes and quantities easily.

#### Acceptance Criteria

1. WHEN a user inputs lottery round information in natural language THEN the Lottery_Agent SHALL process the input through the LLM to extract structured data
2. WHEN the LLM extracts lottery round data THEN the Lottery_Agent SHALL return a JSON object containing round number, prize name, and prize quantity
3. WHEN lottery round data is extracted THEN the Lottery_Agent SHALL display the formatted round information using Stream_Response for user confirmation
4. WHEN a user confirms the lottery round configuration THEN the Lottery_Agent SHALL store the Lottery_Round data in local storage
5. WHEN displaying lottery round information THEN the Lottery_Agent SHALL render a custom card component showing round details

### Requirement 4

**User Story:** As a user, I want to execute lottery draws through natural language commands, so that I can conduct the lottery in a conversational manner.

#### Acceptance Criteria

1. WHEN a user inputs a lottery command such as "start lottery", "next round", or "continue" THEN the Lottery_Agent SHALL initiate the corresponding lottery round
2. WHEN executing a lottery draw THEN the Lottery_Agent SHALL pass the current round information and eligible participants to the LLM without relying on LLM memory
3. WHEN determining eligible participants THEN the Lottery_Agent SHALL exclude all previous Winners from the participant pool
4. WHEN the LLM returns winner information THEN the Lottery_Agent SHALL store the Winner data in local storage
5. WHEN displaying lottery results THEN the Lottery_Agent SHALL render a custom Winner_Card component showing winner details
6. WHEN lottery rounds are executed THEN the Lottery_Agent SHALL enforce sequential order and prevent skipping rounds
7. IF a user attempts to skip a lottery round THEN the Lottery_Agent SHALL display a message indicating that rounds must be executed in order

### Requirement 5

**User Story:** As a user, I want to export winner lists after each lottery round, so that I can keep records of the results.

#### Acceptance Criteria

1. WHEN a lottery round is completed THEN the Lottery_Agent SHALL provide an export button on the Winner_Card
2. WHEN a user clicks the export button THEN the Lottery_Agent SHALL generate a downloadable file containing winner information
3. WHEN generating the export file THEN the Lottery_Agent SHALL name the file using the format: "{round_number}-{prize_name}-{prize_quantity}"

### Requirement 6

**User Story:** As a user, I want to see AI responses rendered in real-time, so that I can have a smooth conversational experience.

#### Acceptance Criteria

1. WHEN the LLM generates a response THEN the Chat_Interface SHALL render the content incrementally using streaming
2. WHEN streaming content is received THEN the Chat_Interface SHALL update the display in real-time without waiting for the complete response
3. WHEN custom components are included in the response THEN the Chat_Interface SHALL render them appropriately after the relevant content is streamed

### Requirement 7

**User Story:** As a user, I want my lottery data to persist across sessions, so that I can resume the lottery process after refreshing the page.

#### Acceptance Criteria

1. WHEN participant data is confirmed THEN the Lottery_Agent SHALL persist the data to local storage immediately
2. WHEN lottery round configuration is confirmed THEN the Lottery_Agent SHALL persist the data to local storage immediately
3. WHEN winner data is generated THEN the Lottery_Agent SHALL persist the data to local storage immediately
4. WHEN a user returns to the lottery page THEN the Lottery_Agent SHALL restore the previous state from local storage
