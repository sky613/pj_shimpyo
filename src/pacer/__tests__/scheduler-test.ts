import { runSchedule, type SchedulerClock } from '../scheduler';

/** jest fake timers 와 함께 쓰는 가상 시계 */
function makeClock(): SchedulerClock & { advance: (ms: number) => void } {
  let now = 0;
  const timers: { at: number; fn: () => void; id: number }[] = [];
  let seq = 0;
  const run = () => {
    timers.sort((a, b) => a.at - b.at);
    while (timers.length && timers[0].at <= now) {
      const t = timers.shift()!;
      t.fn();
      timers.sort((a, b) => a.at - b.at);
    }
  };
  return {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = ++seq;
      timers.push({ at: now + ms, fn, id });
      return id;
    },
    clearTimeout: (h) => {
      const i = timers.findIndex((t) => t.id === h);
      if (i >= 0) timers.splice(i, 1);
    },
    advance: (ms) => {
      // 1ms 단위로 전진하지 않고, 다음 타이머까지 점프하며 실행
      const target = now + ms;
      timers.sort((a, b) => a.at - b.at);
      while (timers.length && timers[0].at <= target) {
        now = timers[0].at;
        run();
        timers.sort((a, b) => a.at - b.at);
      }
      now = target;
    },
  };
}

describe('runSchedule', () => {
  it('fires events at absolute offsets without accumulating drift', () => {
    const clock = makeClock();
    const fired: number[] = [];
    const events = Array.from({ length: 10 }, (_, i) => ({ atMs: i * 1000 }));
    runSchedule({ events, totalMs: 10000, onEvent: (e) => fired.push(e.atMs - clock.now()), clock });

    clock.advance(10000);
    expect(fired).toHaveLength(10);
    // 모든 이벤트가 정확히 예정 시각에 실행 (오차 0)
    expect(fired.every((d) => d === 0)).toBe(true);
  });

  it('fires the atMs=0 event immediately', () => {
    const clock = makeClock();
    const seen: number[] = [];
    runSchedule({ events: [{ atMs: 0 }, { atMs: 500 }], totalMs: 1000, onEvent: (e) => seen.push(e.atMs), clock });
    expect(seen).toEqual([0]);
  });

  it('calls onDone once total duration passes', () => {
    const clock = makeClock();
    const done = jest.fn();
    runSchedule({ events: [{ atMs: 0 }], totalMs: 3000, onEvent: () => {}, onDone: done, clock });
    clock.advance(2999);
    expect(done).not.toHaveBeenCalled();
    clock.advance(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('pause stops events and resume shifts the remaining schedule', () => {
    const clock = makeClock();
    const seen: { at: number; now: number }[] = [];
    const ctrl = runSchedule({
      events: [{ atMs: 0 }, { atMs: 1000 }, { atMs: 2000 }],
      totalMs: 3000,
      onEvent: (e) => seen.push({ at: e.atMs, now: clock.now() }),
      clock,
    });
    clock.advance(1500); // 0, 1000 fired
    ctrl.pause();
    expect(ctrl.isPaused()).toBe(true);
    clock.advance(5000); // nothing while paused
    expect(seen).toHaveLength(2);
    expect(ctrl.elapsedMs()).toBe(1500);
    ctrl.resume();
    clock.advance(500); // elapsed reaches 2000
    expect(seen).toHaveLength(3);
    expect(seen[2].now).toBe(1500 + 5000 + 500);
  });

  it('stop prevents further events and onDone', () => {
    const clock = makeClock();
    const onEvent = jest.fn();
    const onDone = jest.fn();
    const ctrl = runSchedule({ events: [{ atMs: 0 }, { atMs: 1000 }], totalMs: 2000, onEvent, onDone, clock });
    ctrl.stop();
    clock.advance(5000);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(ctrl.isRunning()).toBe(false);
  });

  it('catches up missed events when the timer wakes late', () => {
    const clock = makeClock();
    const seen: number[] = [];
    // 이벤트 사이 간격보다 타이머가 늦게 깨어나는 상황을 흉내내기 위해
    // setTimeout 지연을 강제로 늘린다
    const lazy: SchedulerClock = {
      ...clock,
      setTimeout: (fn, ms) => clock.setTimeout(fn, ms + 2500),
    };
    runSchedule({ events: [{ atMs: 0 }, { atMs: 1000 }, { atMs: 2000 }], totalMs: 10000, onEvent: (e) => seen.push(e.atMs), clock: lazy });
    clock.advance(4000);
    expect(seen).toEqual([0, 1000, 2000]);
  });
});
