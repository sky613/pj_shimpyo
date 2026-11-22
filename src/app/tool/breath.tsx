import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ToolTopBar } from '@/components/ToolTopBar';
import {
  BREATH_DURATIONS_SEC,
  BREATH_PATTERNS,
  BREATH_PHASE_LABELS,
  DEFAULT_BREATH_DURATION_SEC,
  DEFAULT_BREATH_PATTERN,
  type BreathPatternId,
} from '@/config/tools';
import { Spacing } from '@/constants/theme';
import { useBreathPacer } from '@/hooks/useBreathPacer';
import { useCuePlayer } from '@/hooks/useCuePlayer';
import { useTheme } from '@/hooks/use-theme';
import { formatMmSs } from '@/lib/format';
import { finishSession, parseToolParams, startSession, toolParamsForRoute, type ToolRouteParams } from '@/lib/sessionFlow';

const CIRCLE = 240;
const SCALE_MIN = 0.62;
const SCALE_MAX = 1;

export default function BreathScreen() {
  const theme = useTheme();
  const raw = useLocalSearchParams<ToolRouteParams>();
  const params = useMemo(() => parseToolParams(raw), [raw]);
  const reducedMotion = useReducedMotion();
  const playCue = useCuePlayer();

  const [patternId, setPatternId] = useState<BreathPatternId>(DEFAULT_BREATH_PATTERN);
  const [durationSec, setDurationSec] = useState<number>(DEFAULT_BREATH_DURATION_SEC);
  const sessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const scale = useSharedValue(SCALE_MIN);
  const glow = useSharedValue(0.5);

  const goAfter = useCallback(() => {
    const sessionId = sessionIdRef.current;
    router.replace({
      pathname: '/tool/after',
      params: {
        ...toolParamsForRoute(params),
        tool: 'breath',
        sessionId: sessionId ? String(sessionId) : '',
      },
    });
  }, [params]);

  const { state, schedule, start, pause, resume, cancel } = useBreathPacer({
    patternId,
    durationSec,
    onCue: playCue,
    onDone: () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playCue('complete');
      const id = sessionIdRef.current;
      (id ? finishSession(id, true) : Promise.resolve()).finally(goAfter);
    },
  });

  const begin = useCallback(async () => {
    finishedRef.current = false;
    try {
      sessionIdRef.current = await startSession({
        tool: 'breath',
        variant: `${patternId}:${durationSec}`,
        durationSec,
        params,
      });
    } catch {
      sessionIdRef.current = null;
    }
    start();
  }, [patternId, durationSec, params, start]);

  // 플로팅 버튼/홈 추천에서 들어오면 바로 시작 (3탭 원칙)
  const autoStarted = useRef(false);
  useEffect(() => {
    if (params.autostart && !autoStarted.current) {
      autoStarted.current = true;
      void begin();
    }
  }, [params.autostart, begin]);

  // 단계 전환과 같은 틱에 애니메이션 시작 → 진동과 원이 동시에 움직인다
  useEffect(() => {
    if (!state.phase) return;
    const easing = Easing.inOut(Easing.sin);
    const target = state.phase === 'inhale' ? SCALE_MAX : state.phase === 'exhale' ? SCALE_MIN : scale.value;
    if (reducedMotion) {
      glow.value = withTiming(state.phase === 'inhale' ? 1 : state.phase === 'exhale' ? 0.45 : glow.value, {
        duration: state.phaseDurationMs,
        easing,
      });
      return;
    }
    scale.value = withTiming(target, { duration: state.phaseDurationMs, easing });
    glow.value = withTiming(state.phase === 'inhale' ? 1 : 0.6, { duration: state.phaseDurationMs, easing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phaseKey]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  const onClose = () => {
    cancel();
    const id = sessionIdRef.current;
    if (id && !finishedRef.current) void finishSession(id, false, { elapsedMs: state.elapsedMs });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const running = state.status === 'running' || state.status === 'paused';
  const remaining = state.totalMs - state.elapsedMs;
  const pattern = BREATH_PATTERNS[patternId];

  return (
    <Screen scroll={false}>
      <ToolTopBar title="숨쉬기" onClose={onClose} />

      {!running && state.status !== 'done' ? (
        <View style={styles.setup}>
          <AppText variant="title" accessibilityRole="header">
            어떻게 쉴까요?
          </AppText>
          <Segmented<BreathPatternId>
            accessibilityLabel="호흡 패턴"
            value={patternId}
            onChange={setPatternId}
            options={Object.values(BREATH_PATTERNS).map((p) => ({ value: p.id, label: p.label }))}
          />
          <AppText color="textSecondary" center>
            {pattern.short}
          </AppText>
          <Segmented<number>
            accessibilityLabel="길이"
            value={durationSec}
            onChange={setDurationSec}
            options={BREATH_DURATIONS_SEC.map((d) => ({ value: d, label: `${d / 60}분` }))}
          />
          <AppText variant="caption" color="textSecondary" center>
            실제 길이 약 {formatMmSs(schedule.totalMs)} ({schedule.cycles}번 반복)
          </AppText>
          <View style={{ flex: 1 }} />
          <BigButton title="시작" subtitle="진동을 따라 숨을 고르세요" onPress={begin} />
        </View>
      ) : (
        <View style={styles.live}>
          <AppText variant="caption" color="textSecondary">
            {pattern.label} · {state.cycleIndex + 1}/{state.cycles}
          </AppText>
          <View style={styles.circleWrap} accessible accessibilityLabel={`숨쉬기 원, ${state.phase ? BREATH_PHASE_LABELS[state.phase] : ''}`}>
            <View style={[styles.outer, { backgroundColor: theme.breathCircleOuter }]} />
            <Animated.View style={[styles.circle, { backgroundColor: theme.breathCircle }, circleStyle]} />
            <View style={styles.phaseText} pointerEvents="none">
              <AppText variant="phase" center accessibilityLiveRegion="polite">
                {state.status === 'paused' ? '잠시 멈춤' : state.phase ? BREATH_PHASE_LABELS[state.phase] : ''}
              </AppText>
            </View>
          </View>
          <AppText variant="title" center accessibilityLabel={`남은 시간 ${formatMmSs(remaining)}`}>
            {formatMmSs(remaining)}
          </AppText>
          <ProgressBar progress={state.totalMs ? state.elapsedMs / state.totalMs : 0} label="진행" />
          <View style={{ flex: 1 }} />
          {state.status === 'paused' ? (
            <BigButton title="이어서" size="md" onPress={resume} />
          ) : (
            <BigButton title="잠시 멈춤" size="md" tone="secondary" onPress={pause} />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  setup: { flex: 1, gap: Spacing.three },
  live: { flex: 1, alignItems: 'center', gap: Spacing.three },
  circleWrap: { width: CIRCLE + 40, height: CIRCLE + 40, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.four },
  outer: { position: 'absolute', width: CIRCLE + 40, height: CIRCLE + 40, borderRadius: (CIRCLE + 40) / 2, opacity: 0.6 },
  circle: { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2 },
  phaseText: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
