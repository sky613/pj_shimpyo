/**
 * 드리프트 보정 스케줄러.
 * 이벤트마다 setTimeout 을 누적하지 않고, 시작 시각 기준 절대 시각으로 다음 타이머를 잡는다.
 * UI 와 분리되어 있어 jest fake timers 로 검증할 수 있다.
 */
export interface TimedEvent {
  /** 시작 시점부터의 상대 시각 (ms) */
  atMs: number;
}

export interface SchedulerClock {
  now: () => number;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export const defaultClock: SchedulerClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
};

export interface ScheduleController {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** 일시정지 시간을 제외한 진행 시간 (ms) */
  elapsedMs: () => number;
  isPaused: () => boolean;
  isRunning: () => boolean;
}

export interface RunScheduleOptions<E extends TimedEvent> {
  events: E[];
  totalMs: number;
  onEvent: (event: E, index: number) => void;
  onDone?: () => void;
  clock?: SchedulerClock;
}

export function runSchedule<E extends TimedEvent>({
  events,
  totalMs,
  onEvent,
  onDone,
  clock = defaultClock,
}: RunScheduleOptions<E>): ScheduleController {
  const sorted = [...events].sort((a, b) => a.atMs - b.atMs);
  let startedAt = clock.now();
  let pausedAt: number | null = null;
  let pausedTotal = 0;
  let nextIndex = 0;
  let handle: unknown = null;
  let running = true;

  const elapsed = () => {
    if (pausedAt !== null) return pausedAt - startedAt - pausedTotal;
    return clock.now() - startedAt - pausedTotal;
  };

  const clear = () => {
    if (handle !== null) {
      clock.clearTimeout(handle);
      handle = null;
    }
  };

  const fireDue = () => {
    const e = elapsed();
    // 타이머가 늦게 깨어났을 때 지난 이벤트를 몰아서 처리 (최대 1회 틱 당 전부)
    while (nextIndex < sorted.length && sorted[nextIndex].atMs <= e + 1) {
      const ev = sorted[nextIndex];
      nextIndex += 1;
      onEvent(ev, nextIndex - 1);
    }
  };

  const armNext = () => {
    clear();
    if (!running || pausedAt !== null) return;
    const e = elapsed();
    if (nextIndex >= sorted.length) {
      const remaining = totalMs - e;
      if (remaining <= 0) {
        running = false;
        onDone?.();
        return;
      }
      handle = clock.setTimeout(() => {
        handle = null;
        running = false;
        onDone?.();
      }, remaining);
      return;
    }
    const delay = Math.max(0, sorted[nextIndex].atMs - e);
    handle = clock.setTimeout(() => {
      handle = null;
      fireDue();
      armNext();
    }, delay);
  };

  // 시작 시점 이벤트(atMs = 0)는 즉시 처리
  fireDue();
  armNext();

  return {
    pause: () => {
      if (!running || pausedAt !== null) return;
      pausedAt = clock.now();
      clear();
    },
    resume: () => {
      if (!running || pausedAt === null) return;
      pausedTotal += clock.now() - pausedAt;
      pausedAt = null;
      armNext();
    },
    stop: () => {
      running = false;
      clear();
    },
    elapsedMs: () => Math.min(totalMs, Math.max(0, elapsed())),
    isPaused: () => pausedAt !== null,
    isRunning: () => running,
  };
}
