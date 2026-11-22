import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Easing, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { HandIllustration } from '@/components/HandIllustration';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ToolTopBar } from '@/components/ToolTopBar';
import { DEFAULT_GONJI_DURATION_SEC, GONJI_DURATIONS_SEC, GONJI_VARIANT_LABELS, type GonjiVariant } from '@/config/tools';
import { Spacing } from '@/constants/theme';
import { useCuePlayer } from '@/hooks/useCuePlayer';
import { useGonjiPacer } from '@/hooks/useGonjiPacer';
import { useTheme } from '@/hooks/use-theme';
import { formatMmSs } from '@/lib/format';
import { finishSession, parseToolParams, startSession, toolParamsForRoute, type ToolRouteParams } from '@/lib/sessionFlow';
import { useSettings } from '@/lib/SettingsContext';

export default function GonjiScreen() {
  const theme = useTheme();
  const raw = useLocalSearchParams<ToolRouteParams>();
  const params = useMemo(() => parseToolParams(raw), [raw]);
  const { settings } = useSettings();
  const reducedMotion = useReducedMotion();
  const playCue = useCuePlayer();

  const [variant, setVariant] = useState<GonjiVariant>('gonji');
  const [durationSec, setDurationSec] = useState<number>(DEFAULT_GONJI_DURATION_SEC);
  const sessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const pulse = useSharedValue(1);
  const fist = useSharedValue(0);

  const goAfter = useCallback(() => {
    const sessionId = sessionIdRef.current;
    router.replace({
      pathname: '/tool/after',
      params: { ...toolParamsForRoute(params), tool: 'gonji', sessionId: sessionId ? String(sessionId) : '' },
    });
  }, [params]);

  const { state, start, pause, resume, cancel, registerTap } = useGonjiPacer({
    variant,
    durationSec,
    startBpm: settings.gonjiStartBpm,
    endBpm: settings.gonjiEndBpm,
    onCue: playCue,
    onDone: () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playCue('complete');
      const id = sessionIdRef.current;
      (id ? finishSession(id, true, { tapCount: state.tapCount }) : Promise.resolve()).finally(goAfter);
    },
  });

  const begin = useCallback(async () => {
    finishedRef.current = false;
    try {
      sessionIdRef.current = await startSession({ tool: 'gonji', variant: `${variant}:${durationSec}`, durationSec, params });
    } catch {
      sessionIdRef.current = null;
    }
    start();
  }, [variant, durationSec, params, start]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (params.autostart && !autoStarted.current) {
      autoStarted.current = true;
      void begin();
    }
  }, [params.autostart, begin]);

  // 비트마다 손바닥이 살짝 커졌다 돌아온다 (진동과 같은 틱)
  useEffect(() => {
    if (state.status !== 'running') return;
    if (reducedMotion) return;
    pulse.value = withSequence(withTiming(1.08, { duration: 90, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 220 }));
    if (variant === 'jamjam') {
      fist.value = withTiming(state.jamjam === 'squeeze' ? 1 : 0, { duration: 260, easing: Easing.inOut(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.beatKey]);

  const onClose = () => {
    cancel();
    const id = sessionIdRef.current;
    if (id && !finishedRef.current) void finishSession(id, false, { elapsedMs: state.elapsedMs, tapCount: state.tapCount });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const running = state.status === 'running' || state.status === 'paused';
  const remaining = state.totalMs - state.elapsedMs;

  const guide =
    state.status === 'paused'
      ? '잠시 멈춤'
      : variant === 'jamjam'
        ? state.jamjam === 'squeeze'
          ? '주먹을 쥐어요'
          : '손을 펴요'
        : state.switchNotice
          ? `손을 바꿔요 · ${state.hand === 'left' ? '왼손' : '오른손'} 바닥`
          : `${state.hand === 'left' ? '왼손' : '오른손'} 바닥을 두드려요`;

  return (
    <Screen scroll={false}>
      <ToolTopBar title="손 곤지곤지" onClose={onClose} />

      {!running && state.status !== 'done' ? (
        <View style={styles.setup}>
          <AppText variant="title" accessibilityRole="header">
            어떤 동작으로 할까요?
          </AppText>
          <Segmented<GonjiVariant>
            accessibilityLabel="동작"
            value={variant}
            onChange={setVariant}
            options={(Object.keys(GONJI_VARIANT_LABELS) as GonjiVariant[]).map((v) => ({ value: v, label: GONJI_VARIANT_LABELS[v] }))}
          />
          <AppText color="textSecondary" center>
            {variant === 'gonji'
              ? '진동에 맞춰 한 손 검지로 다른 손바닥을 톡톡 두드려요. 30초마다 손을 바꿔요.'
              : '진동에 맞춰 두 손을 쥐었다 펴요.'}
          </AppText>
          <Segmented<number>
            accessibilityLabel="길이"
            value={durationSec}
            onChange={setDurationSec}
            options={GONJI_DURATIONS_SEC.map((d) => ({ value: d, label: `${d / 60}분` }))}
          />
          <AppText variant="caption" color="textSecondary" center>
            분당 {settings.gonjiStartBpm}회에서 {settings.gonjiEndBpm}회로 천천히 느려져요
          </AppText>
          <View style={{ flex: 1 }} />
          <BigButton title="시작" subtitle="화면을 두드려도 괜찮아요" onPress={begin} />
        </View>
      ) : (
        <View style={styles.live}>
          <AppText variant="caption" color="textSecondary">
            분당 약 {Math.round(state.bpm)}회 · 탭 {state.tapCount}번
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="손바닥. 박자에 맞춰 두드리세요"
            onPress={() => {
              registerTap();
              if (!reducedMotion) pulse.set(withSequence(withTiming(0.96, { duration: 60 }), withTiming(1, { duration: 120 })));
            }}
            style={[styles.tapArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <HandIllustration pulse={pulse} fist={fist} side={state.hand} />
          </Pressable>
          <AppText variant="phase" center accessibilityLiveRegion="polite" style={state.switchNotice && { color: theme.accent }}>
            {guide}
          </AppText>
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
  tapArea: {
    width: '100%',
    minHeight: 300,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
});
