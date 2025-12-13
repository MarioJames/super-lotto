/**
 * Mock data generator for demo mode
 * Generates realistic Chinese participant data for lottery demonstrations
 */

import { Participant, LotteryMode } from '../types';

// Chinese surname pool (常见姓氏)
const SURNAMES = [
  '张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高',
  '郑', '梁', '谢', '宋', '唐', '许', '邓', '冯', '韩', '曹'
];

// Chinese given name character pool (常见名字用字)
const GIVEN_NAME_CHARS = [
  '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
  '勇', '艳', '杰', '娟', '涛', '明', '超', '秀', '霞', '平',
  '刚', '桂', '英', '华', '建', '文', '辉', '玲', '萍', '红',
  '斌', '宇', '鑫', '浩', '凯', '晨', '欣', '婷', '雪', '琳'
];

// Department name pool (部门名称)
const DEPARTMENTS = [
  '技术部', '产品部', '设计部', '市场部', '销售部',
  '人力资源部', '财务部', '运营部', '客服部', '行政部',
  '研发部', '测试部', '数据部', '法务部', '采购部'
];

// All available lottery modes
const ALL_LOTTERY_MODES: LotteryMode[] = [
  LotteryMode.DOUBLE_BALL,
  LotteryMode.SCRATCH,
  LotteryMode.ZUMA,
  LotteryMode.HORSE_RACE,
  LotteryMode.WHEEL,
  LotteryMode.SLOT_MACHINE
];


/**
 * Generate a random Chinese name (2-3 characters)
 */
function generateChineseName(): string {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const nameLength = Math.random() > 0.5 ? 2 : 1; // 50% chance for 2-char given name
  let givenName = '';
  for (let i = 0; i < nameLength; i++) {
    givenName += GIVEN_NAME_CHARS[Math.floor(Math.random() * GIVEN_NAME_CHARS.length)];
  }
  return surname + givenName;
}

/**
 * Generate a random employee ID (e.g., "EMP001")
 */
function generateEmployeeId(index: number): string {
  return `EMP${String(index + 1).padStart(3, '0')}`;
}

/**
 * Generate a random department name
 */
function generateDepartment(): string {
  return DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
}

/**
 * Generate email based on employee ID
 */
function generateEmail(employeeId: string): string {
  return `${employeeId.toLowerCase()}@demo.com`;
}

/**
 * Generate mock participants for demo mode
 * @param count - Number of participants to generate (default: random 10-30)
 * @returns Array of mock participants matching Participant interface
 */
export function generateMockParticipants(count?: number): Participant[] {
  const participantCount = count ?? Math.floor(Math.random() * 21) + 10; // 10-30
  const participants: Participant[] = [];
  const now = new Date();

  for (let i = 0; i < participantCount; i++) {
    const employeeId = generateEmployeeId(i);
    participants.push({
      id: i + 1,
      activityId: 0, // Demo mode uses 0
      name: generateChineseName(),
      employeeId,
      department: generateDepartment(),
      email: generateEmail(employeeId),
      createdAt: now
    });
  }

  return participants;
}

/**
 * Select a random lottery mode, optionally excluding certain modes
 * @param excludeModes - Modes to exclude from selection
 * @returns A randomly selected LotteryMode
 */
export function selectRandomMode(excludeModes?: LotteryMode[]): LotteryMode {
  let availableModes = ALL_LOTTERY_MODES;

  if (excludeModes && excludeModes.length > 0) {
    availableModes = ALL_LOTTERY_MODES.filter(mode => !excludeModes.includes(mode));
    // Reset if all modes are excluded
    if (availableModes.length === 0) {
      availableModes = ALL_LOTTERY_MODES;
    }
  }

  return availableModes[Math.floor(Math.random() * availableModes.length)];
}

/**
 * Select random winners from participants
 * @param participants - Pool of participants to select from
 * @param count - Number of winners to select (default: random 1-3)
 * @returns Array of selected winners
 */
export function selectRandomWinners(
  participants: Participant[],
  count?: number
): Participant[] {
  const winnerCount = count ?? Math.floor(Math.random() * 3) + 1; // 1-3
  const actualCount = Math.min(winnerCount, participants.length);

  // Shuffle and pick
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
}

// Export constants for testing
export { SURNAMES, GIVEN_NAME_CHARS, DEPARTMENTS, ALL_LOTTERY_MODES };
