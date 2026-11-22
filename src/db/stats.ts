import type { EventRow, MoodCheckRow, SessionRow, Stats } from './types';

/** 측정값 계산. sqlite / memory 양쪽에서 공유한다. */
export function computeStats(sessions: SessionRow[], moods: MoodCheckRow[], events: EventRow[]): Stats {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed === 1).length;

  const deltas: number[] = [];
  for (const s of sessions) {
    const before = moods.find((m) => m.session_id === s.id && m.context === 'before');
    const after = moods.find((m) => m.session_id === s.id && m.context === 'after');
    if (before && after) deltas.push(after.level - before.level);
  }

  const secs: number[] = [];
  for (const e of events) {
    if (e.name !== 'tool_started') continue;
    try {
      const p = JSON.parse(e.payload) as { secondsSinceOpen?: number };
      if (typeof p.secondsSinceOpen === 'number' && p.secondsSinceOpen >= 0) secs.push(p.secondsSinceOpen);
    } catch {
      // skip malformed
    }
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  return {
    totalSessions,
    completedSessions,
    completionRate: totalSessions ? completedSessions / totalSessions : null,
    avgDelta: avg(deltas),
    avgSecondsToStart: avg(secs),
  };
}
