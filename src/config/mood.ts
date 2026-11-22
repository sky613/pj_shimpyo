import type { ToolId } from './tools';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: '아주 편안해요',
  2: '괜찮은 편이에요',
  3: '생각이 많아요',
  4: '긴장돼요',
  5: '많이 힘들어요',
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: '🌿',
  2: '🙂',
  3: '🌀',
  4: '😣',
  5: '🌧️',
};

/** 마음 체크 값에 따른 추천 도구 */
export function recommendTool(level: MoodLevel): ToolId {
  if (level >= 4) return 'breath';
  if (level === 3) return 'gonji';
  return 'meditation';
}

/** "아직이요" 를 눌렀을 때 다음으로 제안할 도구 (순환) */
const NEXT_TOOL: Record<ToolId, ToolId> = {
  breath: 'gonji',
  gonji: 'meditation',
  meditation: 'breath',
};

export function nextTool(current: ToolId): ToolId {
  return NEXT_TOOL[current];
}

/** 세 도구를 모두 시도한 뒤에는 도움받을 곳을 안내한다 */
export const MAX_RETRY_ATTEMPTS = 3;

export type AfterAnswer = 'better' | 'notYet' | 'worse';

export const AFTER_ANSWER_LABELS: Record<AfterAnswer, string> = {
  better: '네, 조금 나아졌어요',
  notYet: '아직이요',
  worse: '더 힘들어요',
};

/** 전후 비교를 위해 3지선다 답변을 1~5 단계로 환산한다 */
export function afterLevelFromAnswer(before: MoodLevel, answer: AfterAnswer): MoodLevel {
  if (answer === 'better') return Math.max(1, before - 1) as MoodLevel;
  if (answer === 'worse') return Math.min(5, before + 1) as MoodLevel;
  return before;
}

export function isMoodLevel(value: unknown): value is MoodLevel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}
