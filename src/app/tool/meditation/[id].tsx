import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ToolTopBar } from '@/components/ToolTopBar';
import { findMeditation, MEDITATION_TAG_LABELS } from '@/config/meditations';
import { Spacing } from '@/constants/theme';
import { formatMmSs } from '@/lib/format';
import { finishSession, parseToolParams, startSession, toolParamsForRoute, type ToolRouteParams } from '@/lib/sessionFlow';
import { useSettings } from '@/lib/SettingsContext';

const SKIP_SEC = 15;
const RESUME_MIN_SEC = 5;
const SAVE_EVERY_SEC = 5;

export default function MeditationScreen() {
  const raw = useLocalSearchParams<ToolRouteParams & { id: string }>();
  const params = useMemo(() => parseToolParams(raw), [raw]);
  const meditation = findMeditation(raw.id);
  const { settings, update } = useSettings();

  const player = useAudioPlayer(meditation?.source ?? null);
  const status = useAudioPlayerStatus(player);
  const sessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const [started, setStarted] = useState(false);

  const savedPos = meditation ? settings.meditationProgress[meditation.id] ?? 0 : 0;
  const canResume = savedPos >= RESUME_MIN_SEC && !started;

  // 백그라운드/화면 꺼짐 재생
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  const saveProgress = useCallback(
    (sec: number) => {
      if (!meditation) return;
      void update({ meditationProgress: { ...settings.meditationProgress, [meditation.id]: Math.max(0, Math.floor(sec)) } });
    },
    [meditation, settings.meditationProgress, update],
  );

  const begin = useCallback(
    async (fromSec: number) => {
      if (!meditation) return;
      setStarted(true);
      finishedRef.current = false;
      try {
        sessionIdRef.current = await startSession({
          tool: 'meditation',
          variant: `${meditation.id}:${meditation.minutes}`,
          durationSec: meditation.minutes * 60,
          params,
        });
      } catch {
        sessionIdRef.current = null;
      }
      try {
        player.setActiveForLockScreen(true, { title: meditation.title, artist: '쉼표' });
      } catch {
        // lock screen metadata is optional
      }
      if (fromSec > 0) await player.seekTo(fromSec);
      player.play();
    },
    [meditation, params, player],
  );

  // 주기적으로 이어 듣기 위치 저장
  useEffect(() => {
    if (!started || !status.playing) return;
    if (status.currentTime - lastSavedRef.current >= SAVE_EVERY_SEC) {
      lastSavedRef.current = status.currentTime;
      saveProgress(status.currentTime);
    }
  }, [started, status.playing, status.currentTime, saveProgress]);

  const goAfter = useCallback(() => {
    const sessionId = sessionIdRef.current;
    router.replace({
      pathname: '/tool/after',
      params: { ...toolParamsForRoute(params), tool: 'meditation', sessionId: sessionId ? String(sessionId) : '' },
    });
  }, [params]);

  useEffect(() => {
    if (!started || !status.didJustFinish || finishedRef.current) return;
    finishedRef.current = true;
    saveProgress(0);
    const id = sessionIdRef.current;
    (id ? finishSession(id, true) : Promise.resolve()).finally(goAfter);
  }, [started, status.didJustFinish, saveProgress, goAfter]);

  const onClose = () => {
    try {
      player.pause();
    } catch {
      // ignore
    }
    if (started && !finishedRef.current) {
      saveProgress(status.currentTime);
      const id = sessionIdRef.current;
      if (id) void finishSession(id, false, { positionSec: Math.floor(status.currentTime) });
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/calm');
  };

  if (!meditation) {
    return (
      <Screen>
        <ToolTopBar title="명상" onClose={() => router.replace('/(tabs)/calm')} />
        <AppText>명상을 찾을 수 없어요.</AppText>
      </Screen>
    );
  }

  const duration = status.duration || meditation.minutes * 60;
  const progress = duration ? status.currentTime / duration : 0;

  return (
    <Screen scroll={false}>
      <ToolTopBar title="명상" onClose={onClose} />
      <View style={styles.body}>
        <Card alt style={styles.hero}>
          <AppText variant="caption" color="textSecondary">
            {meditation.minutes}분 · {meditation.tags.map((t) => MEDITATION_TAG_LABELS[t]).join(' · ')}
          </AppText>
          <AppText variant="display">{meditation.title}</AppText>
          <AppText color="textSecondary">{meditation.subtitle}</AppText>
        </Card>

        {!started ? (
          <>
            <View style={{ flex: 1 }} />
            {canResume ? (
              <BigButton title="이어 듣기" subtitle={`${formatMmSs(savedPos * 1000)} 부터`} onPress={() => begin(savedPos)} />
            ) : null}
            <BigButton title="처음부터 듣기" tone={canResume ? 'secondary' : 'primary'} onPress={() => begin(0)} />
            <AppText variant="caption" color="textSecondary" center>
              화면을 꺼도 계속 들을 수 있어요
            </AppText>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <AppText variant="title" center accessibilityLabel={`${formatMmSs(status.currentTime * 1000)} 지남, 전체 ${formatMmSs(duration * 1000)}`}>
              {formatMmSs(status.currentTime * 1000)} / {formatMmSs(duration * 1000)}
            </AppText>
            <ProgressBar progress={progress} label="재생 진행" />
            <View style={styles.controls}>
              <BigButton title={`-${SKIP_SEC}초`} size="md" tone="secondary" style={styles.side} onPress={() => player.seekTo(Math.max(0, status.currentTime - SKIP_SEC))} />
              <BigButton
                title={status.playing ? '일시정지' : '이어서'}
                size="md"
                style={styles.center}
                onPress={() => (status.playing ? player.pause() : player.play())}
              />
              <BigButton title={`+${SKIP_SEC}초`} size="md" tone="secondary" style={styles.side} onPress={() => player.seekTo(Math.min(duration, status.currentTime + SKIP_SEC))} />
            </View>
            <BigButton title="여기까지 듣고 마치기" size="md" tone="ghost" onPress={() => {
              if (finishedRef.current) return;
              finishedRef.current = true;
              player.pause();
              saveProgress(0);
              const id = sessionIdRef.current;
              (id ? finishSession(id, true, { endedEarlyAtSec: Math.floor(status.currentTime) }) : Promise.resolve()).finally(goAfter);
            }} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: Spacing.three },
  hero: { gap: Spacing.two, paddingVertical: Spacing.four },
  controls: { flexDirection: 'row', gap: Spacing.two },
  side: { flex: 1 },
  center: { flex: 1.6 },
});
