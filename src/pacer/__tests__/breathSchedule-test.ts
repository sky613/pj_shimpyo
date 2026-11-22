import { BREATH_PATTERNS } from '@/config/tools';

import { buildBreathSchedule, cycleSeconds, cyclesForDuration } from '../breathSchedule';

describe('breathSchedule', () => {
  it('computes cycle length per pattern', () => {
    expect(cycleSeconds(BREATH_PATTERNS.relax46)).toBe(10);
    expect(cycleSeconds(BREATH_PATTERNS.box)).toBe(16);
    expect(cycleSeconds(BREATH_PATTERNS.calm478)).toBe(19);
  });

  it('rounds to the nearest whole cycle for the target duration', () => {
    expect(cyclesForDuration(BREATH_PATTERNS.relax46, 60)).toBe(6);
    expect(cyclesForDuration(BREATH_PATTERNS.relax46, 180)).toBe(18);
    expect(cyclesForDuration(BREATH_PATTERNS.box, 60)).toBe(4); // 64s
    expect(cyclesForDuration(BREATH_PATTERNS.calm478, 60)).toBe(3); // 57s
    expect(cyclesForDuration(BREATH_PATTERNS.calm478, 5)).toBe(1); // minimum 1
  });

  it('builds a 4-6 one minute schedule with correct phase boundaries', () => {
    const s = buildBreathSchedule('relax46', 60);
    expect(s.cycles).toBe(6);
    expect(s.totalMs).toBe(60000);
    const phases = s.events.filter((e) => e.kind === 'phase');
    expect(phases).toHaveLength(12);
    expect(phases[0]).toMatchObject({ atMs: 0, phase: 'inhale', phaseDurationMs: 4000, haptic: 'inhaleStart' });
    expect(phases[1]).toMatchObject({ atMs: 4000, phase: 'exhale', phaseDurationMs: 6000, haptic: 'exhaleStart' });
    expect(phases[2]).toMatchObject({ atMs: 10000, phase: 'inhale', cycleIndex: 1 });
    expect(phases[11].atMs).toBe(54000);
  });

  it('adds inhale ticks every second and exhale ticks every two seconds', () => {
    const s = buildBreathSchedule('relax46', 10);
    const ticks = s.events.filter((e) => e.kind === 'tick').map((e) => [e.atMs, e.haptic]);
    expect(ticks).toEqual([
      [1000, 'inhaleTick'],
      [2000, 'inhaleTick'],
      [3000, 'inhaleTick'],
      [6000, 'exhaleTick'],
      [8000, 'exhaleTick'],
    ]);
  });

  it('box pattern uses hold cues and no ticks during holds', () => {
    const s = buildBreathSchedule('box', 16);
    const holds = s.events.filter((e) => e.phase === 'holdIn' || e.phase === 'holdOut');
    expect(holds.every((e) => e.kind === 'phase' && e.haptic === 'holdStart')).toBe(true);
    expect(holds).toHaveLength(2);
  });

  it('events are sorted and all within total duration', () => {
    for (const id of ['relax46', 'box', 'calm478'] as const) {
      const s = buildBreathSchedule(id, 180);
      for (let i = 1; i < s.events.length; i += 1) {
        expect(s.events[i].atMs).toBeGreaterThanOrEqual(s.events[i - 1].atMs);
      }
      expect(s.events[s.events.length - 1].atMs).toBeLessThan(s.totalMs);
    }
  });
});
