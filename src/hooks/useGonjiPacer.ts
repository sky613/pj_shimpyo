import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GonjiVariant } from '@/config/tools';
import { buildGonjiSchedule, type GonjiEvent, type GonjiHand, type GonjiHapticCue } from '@/pacer/gonjiSchedule';
import { runSchedule, type ScheduleController, type SchedulerClock } from '@/pacer/scheduler';

export interface GonjiPacerState {
  status: 'idle' | 'running' | 'paused' | 'done';
  /** 비트마다 증가. 손바닥 펄스 애니메이션 트리거 */
  beatKey: number;
  beatIndex: number;
  bpm: number;
  hand: GonjiHand | 'both';
  jamjam: 'squeeze' | 'release' | null;
  /** 손 바꾸기 안내가 떠야 하는 동안 true */
  switchNotice: boolean;
  totalMs: number;
  elapsedMs: number;
  /** 사용자가 화면을 탭한 횟수 */
  tapCount: number;
}

export interface UseGonjiPacerOptions {
  variant: GonjiVariant;
  durationSec: number;
  startBpm?: number;
  endBpm?: number;
  switchEverySec?: number;
  onCue?: (cue: GonjiHapticCue, event: GonjiEvent) => void;
  onDone?: () => void;
  clock?: SchedulerClock;
  tickMs?: number;
  switchNoticeMs?: number;
}

export function useGonjiPacer({
  variant,
  durationSec,
  startBpm,
  endBpm,
  switchEverySec,
  onCue,
  onDone,
  clock,
  tickMs = 250,
  switchNoticeMs = 2500,
}: UseGonjiPacerOptions) {
  const schedule = useMemo(
    () => buildGonjiSchedule({ variant, durationSec, startBpm, endBpm, switchEverySec }),
    [variant, durationSec, startBpm, endBpm, switchEverySec],
  );
  const [state, setState] = useState<GonjiPacerState>({
    status: 'idle',
    beatKey: 0,
    beatIndex: 0,
    bpm: startBpm ?? 0,
    hand: variant === 'jamjam' ? 'both' : 'right',
    jamjam: null,
    switchNotice: false,
    totalMs: schedule.totalMs,
    elapsedMs: 0,
    tapCount: 0,
  });
  const ctrlRef = useRef<ScheduleController | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCueRef = useRef(onCue);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onCueRef.current = onCue;
    onDoneRef.current = onDone;
  });

  const clearNotice = () => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
  };

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    clearNotice();
  }, []);

  const start = useCallback(() => {
    stop();
    setState((s) => ({
      ...s,
      status: 'running',
      elapsedMs: 0,
      tapCount: 0,
      beatIndex: 0,
      switchNotice: false,
      hand: variant === 'jamjam' ? 'both' : 'right',
      totalMs: schedule.totalMs,
    }));
    ctrlRef.current = runSchedule<GonjiEvent>({
      events: schedule.events,
      totalMs: schedule.totalMs,
      clock,
      onEvent: (ev) => {
        onCueRef.current?.(ev.haptic, ev);
        if (ev.kind === 'switch') {
          clearNotice();
          setState((s) => ({ ...s, hand: ev.hand, switchNotice: true }));
          noticeTimer.current = setTimeout(() => {
            setState((s) => ({ ...s, switchNotice: false }));
          }, switchNoticeMs);
          return;
        }
        setState((s) => ({
          ...s,
          beatKey: s.beatKey + 1,
          beatIndex: ev.beatIndex,
          bpm: ev.bpm,
          hand: ev.hand,
          jamjam: ev.jamjam,
        }));
      },
      onDone: () => {
        ctrlRef.current = null;
        clearNotice();
        setState((s) => ({ ...s, status: 'done', elapsedMs: s.totalMs, switchNotice: false }));
        onDoneRef.current?.();
      },
    });
  }, [schedule, clock, stop, variant, switchNoticeMs]);

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
    setState((s) => ({ ...s, status: 'idle' }));
  }, [stop]);

  const registerTap = useCallback(() => {
    setState((s) => (s.status === 'running' ? { ...s, tapCount: s.tapCount + 1 } : s));
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => {
      const ctrl = ctrlRef.current;
      if (ctrl) setState((s) => ({ ...s, elapsedMs: ctrl.elapsedMs() }));
    }, tickMs);
    return () => clearInterval(id);
  }, [state.status, tickMs]);

  useEffect(() => () => stop(), [stop]);

  return { state, schedule, start, pause, resume, cancel, registerTap };
}
