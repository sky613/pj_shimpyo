import { afterLevelFromAnswer, isMoodLevel, type AfterAnswer, type MoodLevel } from '@/config/mood';
import type { ToolId } from '@/config/tools';
import { getRepo } from '@/db';

import { consumeToolEntry } from './appTiming';

/**
 * 도구 화면들이 공통으로 쓰는 세션 흐름.
 * 라우트 파라미터는 문자열이므로 여기서 파싱한다.
 */
export type ToolRouteParams = {
  /** 홈에서 선택한 마음 체크 값 */
  before?: string;
  /** 홈에서 미리 저장한 before 체크의 id */
  checkId?: string;
  /** 진입 경로: home | fab | calm | onboarding | retry */
  entry?: string;
  /** "아직이요" 로 넘어온 횟수 */
  attempt?: string;
  autostart?: string;
};

export interface ParsedToolParams {
  before: MoodLevel | null;
  checkId: number | null;
  entry: string;
  attempt: number;
  autostart: boolean;
}

export function parseToolParams(p: ToolRouteParams): ParsedToolParams {
  const before = Number(p.before);
  const checkId = Number(p.checkId);
  const attempt = Number(p.attempt);
  return {
    before: isMoodLevel(before) ? before : null,
    checkId: Number.isFinite(checkId) && checkId > 0 ? checkId : null,
    entry: p.entry ?? 'unknown',
    attempt: Number.isFinite(attempt) && attempt > 0 ? attempt : 0,
    autostart: p.autostart === '1',
  };
}

export async function startSession(input: {
  tool: ToolId;
  variant: string;
  durationSec: number;
  params: ParsedToolParams;
}): Promise<number> {
  const repo = await getRepo();
  const sessionId = await repo.createSession({ tool: input.tool, variant: input.variant, durationSec: input.durationSec });
  if (input.params.checkId) {
    await repo.attachMoodCheckToSession(input.params.checkId, sessionId);
  } else if (input.params.before) {
    // 홈을 거치지 않고(플로팅 버튼 등) 들어왔는데 before 값이 있으면 지금 저장
    await repo.addMoodCheck({ level: input.params.before, context: 'before', sessionId });
  }
  const timing = consumeToolEntry();
  await repo.logEvent('tool_started', {
    sessionId,
    tool: input.tool,
    variant: input.variant,
    entry: input.params.entry,
    secondsSinceOpen: timing.secondsSinceOpen,
  });
  return sessionId;
}

export async function finishSession(sessionId: number, completed: boolean, extra: Record<string, unknown> = {}) {
  const repo = await getRepo();
  await repo.completeSession(sessionId, completed);
  await repo.logEvent(completed ? 'tool_completed' : 'tool_abandoned', { sessionId, ...extra });
}

export async function recordAfterAnswer(input: {
  sessionId: number;
  before: MoodLevel | null;
  answer: AfterAnswer;
}) {
  const repo = await getRepo();
  if (input.before) {
    const level = afterLevelFromAnswer(input.before, input.answer);
    await repo.addMoodCheck({ level, context: 'after', sessionId: input.sessionId });
  }
  await repo.logEvent('after_answer', { sessionId: input.sessionId, answer: input.answer });
}

export function toolParamsForRoute(params: ParsedToolParams, overrides: Partial<Record<keyof ToolRouteParams, string>> = {}) {
  const out: Record<string, string> = {};
  if (params.before) out.before = String(params.before);
  if (params.checkId) out.checkId = String(params.checkId);
  out.entry = params.entry;
  if (params.attempt) out.attempt = String(params.attempt);
  return { ...out, ...overrides };
}
