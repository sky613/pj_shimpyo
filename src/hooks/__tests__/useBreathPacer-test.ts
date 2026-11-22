import { act, renderHook } from '@testing-library/react-native';

import type { SchedulerClock } from '@/pacer/scheduler';

import { useBreathPacer } from '../useBreathPacer';

/** jest fake timers 기반 시계: Date.now 와 setTimeout 이 함께 전진한다 */
const fakeClock: SchedulerClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe('useBreathPacer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits phase changes and haptic cues in sync', async () => {
    const cues: [number, string][] = [];
    const { result } = await renderHook(() =>
      useBreathPacer({
        patternId: 'relax46',
        durationSec: 10,
        clock: fakeClock,
        onCue: (cue) => cues.push([Date.now(), cue]),
      }),
    );
    expect(result.current.state.status).toBe('idle');

    await act(async () => result.current.start());
    expect(result.current.state.status).toBe('running');
    expect(result.current.state.phase).toBe('inhale');
    expect(result.current.state.phaseDurationMs).toBe(4000);
    expect(cues[0]).toEqual([0, 'inhaleStart']);

    await advance(4000);
    expect(result.current.state.phase).toBe('exhale');
    expect(result.current.state.phaseDurationMs).toBe(6000);
    expect(cues.find(([, c]) => c === 'exhaleStart')?.[0]).toBe(4000);
    expect(cues.filter(([, c]) => c === 'inhaleTick').map(([t]) => t)).toEqual([1000, 2000, 3000]);
  });

  it('completes after total duration and calls onDone once', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() =>
      useBreathPacer({ patternId: 'relax46', durationSec: 10, clock: fakeClock, onDone }),
    );
    await act(async () => result.current.start());
    await advance(10000);
    expect(result.current.state.status).toBe('done');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('pause and resume keep the phase timeline intact', async () => {
    const { result } = await renderHook(() =>
      useBreathPacer({ patternId: 'relax46', durationSec: 10, clock: fakeClock }),
    );
    await act(async () => result.current.start());
    await advance(2000);
    await act(async () => result.current.pause());
    expect(result.current.state.status).toBe('paused');
    await advance(10000);
    expect(result.current.state.phase).toBe('inhale');
    await act(async () => result.current.resume());
    await advance(2000);
    expect(result.current.state.phase).toBe('exhale');
  });

  it('uses whole cycles for box pattern at 1 minute (64s)', async () => {
    const { result } = await renderHook(() =>
      useBreathPacer({ patternId: 'box', durationSec: 60, clock: fakeClock }),
    );
    expect(result.current.schedule.cycles).toBe(4);
    expect(result.current.state.totalMs).toBe(64000);
  });
});
