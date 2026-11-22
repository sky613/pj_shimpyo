import type { MoodLevel } from '@/config/mood';
import type { ToolId } from '@/config/tools';
import type { HapticStrength } from '@/haptics/haptics';

export interface SessionRow {
  id: number;
  tool: ToolId;
  variant: string;
  duration_sec: number;
  completed: 0 | 1;
  started_at: string;
}

export interface MoodCheckRow {
  id: number;
  created_at: string;
  level: MoodLevel;
  context: 'before' | 'after';
  session_id: number | null;
}

export interface SavedMethodRow {
  id: number;
  title: string;
  note: string;
  created_at: string;
}

export interface EventRow {
  id: number;
  name: string;
  payload: string;
  created_at: string;
}

export interface Settings {
  /** 무음 모드 기본값 */
  silentDefault: boolean;
  /** 현재 무음 모드 (진정하기 탭 토글) */
  silentMode: boolean;
  hapticStrength: HapticStrength;
  gonjiStartBpm: number;
  gonjiEndBpm: number;
  onboardingDone: boolean;
  /** 명상 이어 듣기 위치 (초) */
  meditationProgress: Record<string, number>;
}

export const DEFAULT_SETTINGS: Settings = {
  silentDefault: true,
  silentMode: true,
  hapticStrength: 'normal',
  gonjiStartBpm: 80,
  gonjiEndBpm: 50,
  onboardingDone: false,
  meditationProgress: {},
};

/** 나 탭에서 보여주는 세션 + 전후 기록 */
export interface SessionWithMood {
  session: SessionRow;
  before: MoodLevel | null;
  after: MoodLevel | null;
}

export interface Stats {
  totalSessions: number;
  completedSessions: number;
  completionRate: number | null;
  avgDelta: number | null;
  avgSecondsToStart: number | null;
}

export interface Repo {
  init(): Promise<void>;

  createSession(input: { tool: ToolId; variant: string; durationSec: number }): Promise<number>;
  completeSession(id: number, completed: boolean): Promise<void>;
  listSessionsWithMood(limit: number): Promise<SessionWithMood[]>;

  addMoodCheck(input: { level: MoodLevel; context: 'before' | 'after'; sessionId: number | null }): Promise<number>;
  attachMoodCheckToSession(checkId: number, sessionId: number): Promise<void>;

  listSavedMethods(): Promise<SavedMethodRow[]>;
  addSavedMethod(input: { title: string; note: string }): Promise<number>;
  deleteSavedMethod(id: number): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  logEvent(name: string, payload: Record<string, unknown>): Promise<void>;
  getStats(): Promise<Stats>;
}
