import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BreathPatternId, BreathPhase } from '@/config/tools';
import { buildBreathSchedule, type BreathEvent, type BreathHapticCue } from '@/pacer/breathSchedule';
import { runSchedule, type ScheduleController, type SchedulerClock } from '@/pacer/scheduler';

export interface BreathPacerState {
  status: 'idle' | 'running' | 'paused' | 'done';
  phase: BreathPhase | null;
  /** 현재 단계 길이 (ms). 애니메이션 duration 으로 쓴다 */
  phaseDurationMs: number;
  /** 단계가 바뀔 때마다 증가. 애니메이션 재시작 트리거 */
  phaseKey: number;
  cycleIndex: number;
  cycles: number;
  totalMs: number;
  elapsedMs: number;
}

export interface UseBreathPacerOptions {
  patternId: BreathPatternId;
  durationSec: number;
  /** 진동/소리 등 부수효과. 단계 시작과 틱 모두 전달 */
  onCue?: (cue: BreathHapticCue, event: BreathEvent) => void;
  onDone?: () => void;
  clock?: SchedulerClock;
  /** 남은 시간 표시 갱신 간격 */
  tickMs?: number;
}

/**
 * 숨쉬기 타이밍 훅. UI 와 분리되어 있고, 단계 전환과 진동 cue 를 같은 스케줄러 콜백에서 내보내
 * 원 애니메이션과 진동이 같은 틱에 시작한다.
 */
export function useBreathPacer({
  patternId,
  durationSec,
  onCue,
  onDone,
  clock,
  tickMs = 250,
}: UseBreathPacerOptions) {
  const schedule = useMemo(() => buildBreathSchedule(patternId, durationSec), [patternId, durationSec]);
  const [state, setState] = useState<BreathPacerState>({
    status: 'idle',
    phase: null,
    phaseDurationMs: 0,
    phaseKey: 0,
    cycleIndex: 0,
    cycles: schedule.cycles,
    totalMs: schedule.totalMs,
    elapsedMs: 0,
  });
  const ctrlRef = useRef<ScheduleController | null>(null);
  const onCueRef = useRef(onCue);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onCueRef.current = onCue;
    onDoneRef.current = onDone;
  });

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    setState((s) => ({ ...s, status: 'running', elapsedMs: 0, cycles: schedule.cycles, totalMs: schedule.totalMs }));
    ctrlRef.current = runSchedule<BreathEvent>({
      events: schedule.events,
      totalMs: schedule.totalMs,
      clock,
      onEvent: (ev) => {
        if (ev.haptic) onCueRef.current?.(ev.haptic, ev);
        if (ev.kind === 'phase') {
          setState((s) => ({
            ...s,
            phase: ev.phase,
            phaseDurationMs: ev.phaseDurationMs,
            phaseKey: s.phaseKey + 1,
            cycleIndex: ev.cycleIndex,
          }));
        }
      },
      onDone: () => {
        ctrlRef.current = null;
        setState((s) => ({ ...s, status: 'done', phase: null, elapsedMs: s.totalMs }));
        onDoneRef.current?.();
      },
    });
  }, [schedule, clock, stop]);

  const pause = useCallback(() => {
    ctrlRef.current?.pause();
    setState((s) => (s.status === 'running' ? { ...s, status: 'paused' } : s));
  }, []);

  const resume = useCallback(() => {
    ctrlRef.current?.resume();
    setState((s) => (s.status === 'paused' ? { ...s, status: 'running' } : s));
  }, []);

  const cancel = useCallback(() => {
    stop();
    setState((s) => ({ ...s, status: 'idle', phase: null }));
  }, [stop]);

  // 남은 시간 갱신
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => {
      const ctrl = ctrlRef.current;
      if (ctrl) setState((s) => ({ ...s, elapsedMs: ctrl.elapsedMs() }));
    }, tickMs);
    return () => clearInterval(id);
  }, [state.status, tickMs]);

  useEffect(() => () => stop(), [stop]);

  return { state, schedule, start, pause, resume, cancel };
}
