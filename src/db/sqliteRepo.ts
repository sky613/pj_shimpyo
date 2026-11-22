import * as SQLite from 'expo-sqlite';

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

const DB_NAME = 'shimpyo.db';
const SCHEMA_VERSION = 1;

/**
 * 암호화(SQLCipher)는 2단계에서 config plugin 으로 켠다.
 * 그때 expo-secure-store 에 보관한 키로 PRAGMA key 를 실행하면 된다.
 */
export class SqliteRepo implements Repo {
  private db: SQLite.SQLiteDatabase | null = null;

  private get conn(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('database not initialized');
    return this.db;
  }

  async init() {
    if (this.db) return;
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version ?? 0;
    if (version < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tool TEXT NOT NULL,
          variant TEXT NOT NULL,
          duration_sec INTEGER NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          started_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mood_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL,
          level INTEGER NOT NULL,
          context TEXT NOT NULL,
          session_id INTEGER REFERENCES sessions(id)
        );
        CREATE INDEX IF NOT EXISTS idx_mood_session ON mood_checks(session_id, context);
        CREATE TABLE IF NOT EXISTS saved_methods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    }
    this.db = db;
  }

  async createSession(input: { tool: SessionRow['tool']; variant: string; durationSec: number }) {
    const r = await this.conn.runAsync(
      'INSERT INTO sessions (tool, variant, duration_sec, completed, started_at) VALUES (?, ?, ?, 0, ?)',
      input.tool,
      input.variant,
      input.durationSec,
      new Date().toISOString(),
    );
    return r.lastInsertRowId;
  }

  async completeSession(id: number, completed: boolean) {
    await this.conn.runAsync('UPDATE sessions SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
  }

  async listSessionsWithMood(limit: number): Promise<SessionWithMood[]> {
    const rows = await this.conn.getAllAsync<SessionRow & { before: number | null; after: number | null }>(
      `SELECT s.*,
         (SELECT level FROM mood_checks m WHERE m.session_id = s.id AND m.context = 'before' ORDER BY m.id DESC LIMIT 1) AS before,
         (SELECT level FROM mood_checks m WHERE m.session_id = s.id AND m.context = 'after' ORDER BY m.id DESC LIMIT 1) AS after
       FROM sessions s ORDER BY s.started_at DESC LIMIT ?`,
      limit,
    );
    return rows.map(({ before, after, ...session }) => ({
      session,
      before: (before as MoodLevel | null) ?? null,
      after: (after as MoodLevel | null) ?? null,
    }));
  }

  async addMoodCheck(input: { level: MoodLevel; context: 'before' | 'after'; sessionId: number | null }) {
    const r = await this.conn.runAsync(
      'INSERT INTO mood_checks (created_at, level, context, session_id) VALUES (?, ?, ?, ?)',
      new Date().toISOString(),
      input.level,
      input.context,
      input.sessionId,
    );
    return r.lastInsertRowId;
  }

  async attachMoodCheckToSession(checkId: number, sessionId: number) {
    await this.conn.runAsync('UPDATE mood_checks SET session_id = ? WHERE id = ?', sessionId, checkId);
  }

  async listSavedMethods() {
    return this.conn.getAllAsync<SavedMethodRow>('SELECT * FROM saved_methods ORDER BY created_at DESC');
  }

  async addSavedMethod(input: { title: string; note: string }) {
    const r = await this.conn.runAsync(
      'INSERT INTO saved_methods (title, note, created_at) VALUES (?, ?, ?)',
      input.title,
      input.note,
      new Date().toISOString(),
    );
    return r.lastInsertRowId;
  }

  async deleteSavedMethod(id: number) {
    await this.conn.runAsync('DELETE FROM saved_methods WHERE id = ?', id);
  }

  async getSettings(): Promise<Settings> {
    const rows = await this.conn.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const out: Settings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        (out as unknown as Record<string, unknown>)[row.key] = JSON.parse(row.value);
      } catch {
        // skip
      }
    }
    return out;
  }

  async updateSettings(patch: Partial<Settings>) {
    await this.conn.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(patch)) {
        await this.conn.runAsync(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          key,
          JSON.stringify(value),
        );
      }
    });
    return this.getSettings();
  }

  async logEvent(name: string, payload: Record<string, unknown>) {
    await this.conn.runAsync(
      'INSERT INTO events (name, payload, created_at) VALUES (?, ?, ?)',
      name,
      JSON.stringify(payload),
      new Date().toISOString(),
    );
  }

  async getStats(): Promise<Stats> {
    const sessions = await this.conn.getAllAsync<SessionRow>('SELECT * FROM sessions');
    const moods = await this.conn.getAllAsync<MoodCheckRow>('SELECT * FROM mood_checks');
    const events = await this.conn.getAllAsync<EventRow>("SELECT * FROM events WHERE name = 'tool_started'");
    return computeStats(sessions, moods, events);
  }
}
