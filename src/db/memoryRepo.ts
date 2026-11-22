import type { MoodLevel } from '@/config/mood';

import {
  DEFAULT_SETTINGS,
  type EventRow,
  type MoodCheckRow,
  type Repo,
  type SavedMethodRow,
  type SessionRow,
  type SessionWithMood,
  type Settings,
  type Stats,
} from './types';
import { computeStats } from './stats';

/**
 * 웹 미리보기와 테스트용 메모리 저장소.
 * 네이티브에서는 sqliteRepo 가 쓰인다.
 */
export class MemoryRepo implements Repo {
  private sessions: SessionRow[] = [];
  private moods: MoodCheckRow[] = [];
  private saved: SavedMethodRow[] = [];
  private events: EventRow[] = [];
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private seq = 0;

  async init() {}

  async createSession(input: { tool: SessionRow['tool']; variant: string; durationSec: number }) {
    const id = ++this.seq;
    this.sessions.push({
      id,
      tool: input.tool,
      variant: input.variant,
      duration_sec: input.durationSec,
      completed: 0,
      started_at: new Date().toISOString(),
    });
    return id;
  }

  async completeSession(id: number, completed: boolean) {
    const s = this.sessions.find((x) => x.id === id);
    if (s) s.completed = completed ? 1 : 0;
  }

  async listSessionsWithMood(limit: number): Promise<SessionWithMood[]> {
    return [...this.sessions]
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit)
      .map((session) => ({
        session,
        before: this.moods.find((m) => m.session_id === session.id && m.context === 'before')?.level ?? null,
        after: this.moods.find((m) => m.session_id === session.id && m.context === 'after')?.level ?? null,
      }));
  }

  async addMoodCheck(input: { level: MoodLevel; context: 'before' | 'after'; sessionId: number | null }) {
    const id = ++this.seq;
    this.moods.push({
      id,
      created_at: new Date().toISOString(),
      level: input.level,
      context: input.context,
      session_id: input.sessionId,
    });
    return id;
  }

  async attachMoodCheckToSession(checkId: number, sessionId: number) {
    const m = this.moods.find((x) => x.id === checkId);
    if (m) m.session_id = sessionId;
  }

  async listSavedMethods() {
    return [...this.saved].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async addSavedMethod(input: { title: string; note: string }) {
    const id = ++this.seq;
    this.saved.push({ id, title: input.title, note: input.note, created_at: new Date().toISOString() });
    return id;
  }

  async deleteSavedMethod(id: number) {
    this.saved = this.saved.filter((s) => s.id !== id);
  }

  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = { ...this.settings, ...patch };
    return { ...this.settings };
  }

  async logEvent(name: string, payload: Record<string, unknown>) {
    this.events.push({ id: ++this.seq, name, payload: JSON.stringify(payload), created_at: new Date().toISOString() });
  }

  async getStats(): Promise<Stats> {
    return computeStats(this.sessions, this.moods, this.events);
  }
}
