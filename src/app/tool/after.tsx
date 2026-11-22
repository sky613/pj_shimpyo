import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { AFTER_ANSWER_LABELS, MAX_RETRY_ATTEMPTS, nextTool, type AfterAnswer } from '@/config/mood';
import { TOOL_LABELS, type ToolId } from '@/config/tools';
import { Spacing } from '@/constants/theme';
import { playHaptic } from '@/haptics/haptics';
import { markToolEntry } from '@/lib/appTiming';
import { parseToolParams, recordAfterAnswer, toolParamsForRoute, type ToolRouteParams } from '@/lib/sessionFlow';

type Params = ToolRouteParams & { tool?: ToolId; sessionId?: string };

export default function AfterScreen() {
  const raw = useLocalSearchParams<Params>();
  const params = useMemo(() => parseToolParams(raw), [raw]);
  const tool = (raw.tool ?? 'breath') as ToolId;
  const sessionId = Number(raw.sessionId) || null;
  const [busy, setBusy] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  const answer = async (a: AfterAnswer) => {
    if (busy) return;
    setBusy(true);
    playHaptic('select');
    try {
      if (sessionId) await recordAfterAnswer({ sessionId, before: params.before, answer: a });
    } catch {
      // 저장 실패는 흐름을 막지 않는다
    }

    if (a === 'better') {
      router.replace({ pathname: '/tool/done', params: { ...toolParamsForRoute(params), tool, sessionId: raw.sessionId ?? '' } });
      return;
    }
    if (a === 'worse') {
      router.replace({ pathname: '/help', params: { from: 'after' } });
      return;
    }
    // 아직이요 → 다른 도구 (세 도구를 모두 거치면 도움받을 곳 안내)
    const attempt = params.attempt + 1;
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      setExhausted(true);
      setBusy(false);
      return;
    }
    const next = nextTool(tool);
    markToolEntry('retry');
    const nextParams = toolParamsForRoute(params, { entry: 'retry', attempt: String(attempt), autostart: '1' });
    if (next === 'meditation') {
      router.replace({ pathname: '/(tabs)/calm', params: nextParams });
    } else {
      router.replace({ pathname: next === 'breath' ? '/tool/breath' : '/tool/gonji', params: nextParams });
    }
  };

  if (exhausted) {
    return (
      <Screen>
        <View style={styles.top}>
          <AppText variant="display" accessibilityRole="header">
            애써 주셔서 고마워요
          </AppText>
          <AppText color="textSecondary">
            여러 방법을 해봤는데도 가라앉지 않을 때가 있어요. 혼자 버티지 않아도 괜찮아요. 지금 이야기를 들어줄 곳이 있어요.
          </AppText>
        </View>
        <BigButton title="도움받을 곳 보기" onPress={() => router.replace({ pathname: '/help', params: { from: 'after' } })} />
        <BigButton title="홈으로" tone="ghost" size="md" onPress={() => router.replace('/(tabs)/home')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <AppText variant="caption" color="textSecondary">
          {TOOL_LABELS[tool]} 마침
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          조금 나아졌나요?
        </AppText>
      </View>
      <Card>
        <AppText color="textSecondary">정답은 없어요. 지금 느껴지는 대로 골라 주세요.</AppText>
      </Card>
      <View style={{ flex: 1 }} />
      <BigButton title={AFTER_ANSWER_LABELS.better} onPress={() => answer('better')} disabled={busy} />
      <BigButton title={AFTER_ANSWER_LABELS.notYet} tone="secondary" onPress={() => answer('notYet')} disabled={busy} />
      <BigButton title={AFTER_ANSWER_LABELS.worse} tone="ghost" onPress={() => answer('worse')} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: Spacing.two, marginTop: Spacing.four },
});
