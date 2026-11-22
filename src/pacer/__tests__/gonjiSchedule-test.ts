import { bpmAt, buildGonjiSchedule } from '../gonjiSchedule';

describe('gonjiSchedule', () => {
  it('interpolates bpm linearly from start to end', () => {
    expect(bpmAt(0, 80, 50)).toBe(80);
    expect(bpmAt(0.5, 80, 50)).toBe(65);
    expect(bpmAt(1, 80, 50)).toBe(50);
    expect(bpmAt(2, 80, 50)).toBe(50); // clamped
  });

  it('slows down over the full duration', () => {
    const s = buildGonjiSchedule({ variant: 'gonji', durationSec: 60 });
    const beats = s.events.filter((e) => e.kind === 'beat');
    expect(beats[0].bpm).toBe(80);
    expect(beats[beats.length - 1].bpm).toBeLessThanOrEqual(52);
    expect(beats[beats.length - 1].bpm).toBeGreaterThanOrEqual(50);
    // 간격이 단조 증가 (점점 느려짐)
    for (let i = 2; i < beats.length; i += 1) {
      const prev = beats[i - 1].atMs - beats[i - 2].atMs;
      const cur = beats[i].atMs - beats[i - 1].atMs;
      expect(cur).toBeGreaterThanOrEqual(prev - 1);
    }
    // 80→50 선형 감속 1분이면 약 65회
    expect(s.beatCount).toBeGreaterThanOrEqual(62);
    expect(s.beatCount).toBeLessThanOrEqual(68);
  });

  it('inserts hand switch cues every 30 seconds and alternates the hand', () => {
    const s = buildGonjiSchedule({ variant: 'gonji', durationSec: 120, switchEverySec: 30 });
    const switches = s.events.filter((e) => e.kind === 'switch');
    expect(switches.map((e) => e.atMs)).toEqual([30000, 60000, 90000]);
    expect(switches.map((e) => e.hand)).toEqual(['left', 'right', 'left']);
    const firstBeatAfterSwitch = s.events.find((e) => e.kind === 'beat' && e.atMs >= 30000);
    expect(firstBeatAfterSwitch?.hand).toBe('left');
    expect(s.events.find((e) => e.kind === 'beat')?.hand).toBe('right');
  });

  it('jamjam alternates squeeze/release and has no hand switches', () => {
    const s = buildGonjiSchedule({ variant: 'jamjam', durationSec: 60 });
    expect(s.events.some((e) => e.kind === 'switch')).toBe(false);
    const beats = s.events.filter((e) => e.kind === 'beat');
    expect(beats[0]).toMatchObject({ jamjam: 'squeeze', haptic: 'beat', hand: 'both' });
    expect(beats[1]).toMatchObject({ jamjam: 'release', haptic: 'beatSoft' });
  });

  it('stretches the deceleration across a 2 minute session', () => {
    const s = buildGonjiSchedule({ variant: 'gonji', durationSec: 120 });
    const beats = s.events.filter((e) => e.kind === 'beat');
    const midBeat = beats.find((b) => b.atMs >= 60000)!;
    expect(midBeat.bpm).toBeCloseTo(65, 0);
  });

  it('respects custom bpm range from settings', () => {
    const s = buildGonjiSchedule({ variant: 'gonji', durationSec: 60, startBpm: 100, endBpm: 40 });
    const beats = s.events.filter((e) => e.kind === 'beat');
    expect(beats[0].bpm).toBe(100);
    expect(beats[1].atMs).toBe(600);
  });
});
