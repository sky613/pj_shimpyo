import {
  BREATH_PATTERNS,
  type BreathPattern,
  type BreathPatternId,
  type BreathPhase,
} from '@/config/tools';

import type { TimedEvent } from './scheduler';

export type BreathHapticCue = 'inhaleStart' | 'inhaleTick' | 'holdStart' | 'exhaleStart' | 'exhaleTick';

export interface BreathEvent extends TimedEvent {
  kind: 'phase' | 'tick';
  phase: BreathPhase;
  /** 이 단계의 길이 (ms). tick 이벤트는 소속 단계의 길이 */
  phaseDurationMs: number;
  cycleIndex: number;
  haptic: BreathHapticCue | null;
}

export interface BreathSchedule {
  patternId: BreathPatternId;
  cycleMs: number;
  cycles: number;
  totalMs: number;
  events: BreathEvent[];
}

export function cycleSeconds(pattern: BreathPattern): number {
  return pattern.steps.reduce((sum, s) => sum + s.seconds, 0);
}

/** 목표 길이에 가장 가까운 정수 사이클 수 (최소 1) */
export function cyclesForDuration(pattern: BreathPattern, targetSec: number): number {
  return Math.max(1, Math.round(targetSec / cycleSeconds(pattern)));
}

function phaseStartCue(phase: BreathPhase): BreathHapticCue | null {
  switch (phase) {
    case 'inhale':
      return 'inhaleStart';
    case 'exhale':
      return 'exhaleStart';
    case 'holdIn':
    case 'holdOut':
      return 'holdStart';
  }
}

/**
 * 들숨: 매초 가벼운 틱 (올라가는 느낌)
 * 날숨: 2초마다 부드러운 틱 (내려가는 느낌)
 * 멈춤: 시작 신호만
 */
function tickCue(phase: BreathPhase, secondInPhase: number): BreathHapticCue | null {
  if (phase === 'inhale') return 'inhaleTick';
  if (phase === 'exhale') return secondInPhase % 2 === 0 ? 'exhaleTick' : null;
  return null;
}

export function buildBreathSchedule(patternId: BreathPatternId, targetSec: number): BreathSchedule {
  const pattern = BREATH_PATTERNS[patternId];
  const cycleMs = cycleSeconds(pattern) * 1000;
  const cycles = cyclesForDuration(pattern, targetSec);
  const events: BreathEvent[] = [];

  let t = 0;
  for (let c = 0; c < cycles; c += 1) {
    for (const step of pattern.steps) {
      const phaseDurationMs = step.seconds * 1000;
      events.push({
        atMs: t,
        kind: 'phase',
        phase: step.phase,
        phaseDurationMs,
        cycleIndex: c,
        haptic: phaseStartCue(step.phase),
      });
      for (let s = 1; s < step.seconds; s += 1) {
        const haptic = tickCue(step.phase, s);
        if (haptic) {
          events.push({
            atMs: t + s * 1000,
            kind: 'tick',
            phase: step.phase,
            phaseDurationMs,
            cycleIndex: c,
            haptic,
          });
        }
      }
      t += phaseDurationMs;
    }
  }

  return { patternId, cycleMs, cycles, totalMs: cycles * cycleMs, events };
}
