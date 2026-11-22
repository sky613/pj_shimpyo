import { GONJI_DEFAULTS, type GonjiVariant } from '@/config/tools';

import type { TimedEvent } from './scheduler';

export type GonjiHand = 'left' | 'right';
export type GonjiHapticCue = 'beat' | 'beatSoft' | 'switchHands';

export interface GonjiEvent extends TimedEvent {
  kind: 'beat' | 'switch';
  /** 이 시점의 박자 (분당) */
  bpm: number;
  beatIndex: number;
  /** 곤지곤지: 두드릴 손바닥. 잼잼: 항상 양손 */
  hand: GonjiHand | 'both';
  /** 잼잼 모드 안내 */
  jamjam: 'squeeze' | 'release' | null;
  haptic: GonjiHapticCue;
}

export interface GonjiScheduleInput {
  variant: GonjiVariant;
  durationSec: number;
  startBpm?: number;
  endBpm?: number;
  switchEverySec?: number;
}

export interface GonjiSchedule {
  variant: GonjiVariant;
  totalMs: number;
  beatCount: number;
  events: GonjiEvent[];
}

export function bpmAt(progress: number, startBpm: number, endBpm: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return startBpm + (endBpm - startBpm) * p;
}

/**
 * 박자는 startBpm 에서 endBpm 으로 전체 길이에 걸쳐 선형 감속한다.
 * (2분 모드도 전체 길이에 비례해 펼친다)
 */
export function buildGonjiSchedule({
  variant,
  durationSec,
  startBpm = GONJI_DEFAULTS.startBpm,
  endBpm = GONJI_DEFAULTS.endBpm,
  switchEverySec = GONJI_DEFAULTS.switchEverySec,
}: GonjiScheduleInput): GonjiSchedule {
  const totalMs = durationSec * 1000;
  const events: GonjiEvent[] = [];

  // 손 바꾸기 시점 (곤지곤지만)
  const switchTimes: number[] = [];
  if (variant === 'gonji') {
    for (let s = switchEverySec; s < durationSec; s += switchEverySec) {
      switchTimes.push(s * 1000);
    }
  }

  let tMs = 0;
  let beatIndex = 0;
  let hand: GonjiHand = 'right';
  let nextSwitch = 0;

  while (tMs < totalMs) {
    // 이 비트 이전에 도달한 손 바꾸기 이벤트 삽입
    while (nextSwitch < switchTimes.length && switchTimes[nextSwitch] <= tMs) {
      hand = hand === 'right' ? 'left' : 'right';
      events.push({
        atMs: switchTimes[nextSwitch],
        kind: 'switch',
        bpm: bpmAt(switchTimes[nextSwitch] / totalMs, startBpm, endBpm),
        beatIndex,
        hand,
        jamjam: null,
        haptic: 'switchHands',
      });
      nextSwitch += 1;
    }

    const bpm = bpmAt(tMs / totalMs, startBpm, endBpm);
    const isJamjam = variant === 'jamjam';
    events.push({
      atMs: Math.round(tMs),
      kind: 'beat',
      bpm,
      beatIndex,
      hand: isJamjam ? 'both' : hand,
      jamjam: isJamjam ? (beatIndex % 2 === 0 ? 'squeeze' : 'release') : null,
      haptic: isJamjam && beatIndex % 2 === 1 ? 'beatSoft' : 'beat',
    });

    beatIndex += 1;
    tMs += 60000 / bpm;
  }

  return { variant, totalMs, beatCount: beatIndex, events };
}
