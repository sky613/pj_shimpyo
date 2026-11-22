import { act, renderHook } from '@testing-library/react-native';

import type { SchedulerClock } from '@/pacer/scheduler';

import { useGonjiPacer } from '../useGonjiPacer';

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

describe('useGonjiPacer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('beats slow down and the hand switches at 30s', async () => {
    const cues: [number, string][] = [];
    const { result } = await renderHook(() =>
      useGonjiPacer({
        variant: 'gonji',
        durationSec: 60,
        clock: fakeClock,
        onCue: (cue) => cues.push([Date.now(), cue]),
      }),
    );
    await act(async () => result.current.start());
    expect(result.current.state.hand).toBe('right');
    expect(result.current.state.bpm).toBe(80);

    await advance(30000);
    expect(result.current.state.hand).toBe('left');
    expect(result.current.state.switchNotice).toBe(true);
    expect(cues.find(([, c]) => c === 'switchHands')?.[0]).toBe(30000);

    await advance(3000);
    expect(result.current.state.switchNotice).toBe(false);
    expect(result.current.state.bpm).toBeLessThan(70);

    await advance(27000);
    expect(result.current.state.status).toBe('done');
    const beats = cues.filter(([, c]) => c === 'beat');
    expect(beats.length).toBeGreaterThanOrEqual(62);
  });

  it('counts screen taps only while running', async () => {
    const { result } = await renderHook(() =>
      useGonjiPacer({ variant: 'gonji', durationSec: 60, clock: fakeClock }),
    );
    await act(async () => result.current.registerTap());
    expect(result.current.state.tapCount).toBe(0);
    await act(async () => result.current.start());
    await act(async () => {
      result.current.registerTap();
      result.current.registerTap();
    });
    expect(result.current.state.tapCount).toBe(2);
  });

  it('jamjam alternates squeeze and release', async () => {
    const { result } = await renderHook(() =>
      useGonjiPacer({ variant: 'jamjam', durationSec: 60, clock: fakeClock }),
    );
    await act(async () => result.current.start());
    expect(result.current.state.jamjam).toBe('squeeze');
    expect(result.current.state.hand).toBe('both');
    await advance(750);
    expect(result.current.state.jamjam).toBe('release');
  });
});
