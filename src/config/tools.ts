/**
 * 진정 도구 공통 상수. 박자, 길이, 패턴은 모두 여기서 조정한다.
 */
export type ToolId = 'breath' | 'gonji' | 'meditation';

export const TOOL_LABELS: Record<ToolId, string> = {
  breath: '숨쉬기',
  gonji: '손 곤지곤지',
  meditation: '명상',
};

export const TOOL_DESCRIPTIONS: Record<ToolId, string> = {
  breath: '원을 따라 천천히 숨을 고르세요',
  gonji: '진동에 맞춰 손바닥을 두드려요',
  meditation: '짧은 음성 안내로 마음을 가라앉혀요',
};

// ---------- 숨쉬기 ----------
export type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export interface BreathPatternStep {
  phase: BreathPhase;
  seconds: number;
}

export type BreathPatternId = 'relax46' | 'box' | 'calm478';

export interface BreathPattern {
  id: BreathPatternId;
  label: string;
  short: string;
  steps: BreathPatternStep[];
}

export const BREATH_PATTERNS: Record<BreathPatternId, BreathPattern> = {
  relax46: {
    id: 'relax46',
    label: '기본 4-6',
    short: '들숨 4초 · 날숨 6초',
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'exhale', seconds: 6 },
    ],
  },
  box: {
    id: 'box',
    label: '박스 4-4-4-4',
    short: '들숨 · 멈춤 · 날숨 · 멈춤 각 4초',
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'holdIn', seconds: 4 },
      { phase: 'exhale', seconds: 4 },
      { phase: 'holdOut', seconds: 4 },
    ],
  },
  calm478: {
    id: 'calm478',
    label: '4-7-8',
    short: '들숨 4초 · 멈춤 7초 · 날숨 8초',
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'holdIn', seconds: 7 },
      { phase: 'exhale', seconds: 8 },
    ],
  },
};

export const DEFAULT_BREATH_PATTERN: BreathPatternId = 'relax46';
export const BREATH_DURATIONS_SEC = [60, 180] as const;
export const DEFAULT_BREATH_DURATION_SEC = 60;

export const BREATH_PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: '들이쉬세요',
  holdIn: '잠시 멈춰요',
  exhale: '내쉬세요',
  holdOut: '잠시 멈춰요',
};

// ---------- 손 곤지곤지 ----------
export type GonjiVariant = 'gonji' | 'jamjam';

export const GONJI_DEFAULTS = {
  /** 시작 박자 (분당 횟수) */
  startBpm: 80,
  /** 종료 박자 (분당 횟수). 전체 길이에 걸쳐 선형으로 느려진다. */
  endBpm: 50,
  /** 손 바꾸기 안내 간격 (초). 잼잼 모드에서는 쓰지 않는다. */
  switchEverySec: 30,
  /** 설정 화면에서 허용하는 박자 범위 */
  minBpm: 30,
  maxBpm: 120,
} as const;

export const GONJI_DURATIONS_SEC = [60, 120] as const;
export const DEFAULT_GONJI_DURATION_SEC = 60;

export const GONJI_VARIANT_LABELS: Record<GonjiVariant, string> = {
  gonji: '곤지곤지',
  jamjam: '잼잼',
};
