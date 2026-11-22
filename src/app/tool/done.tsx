import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { MOOD_LABELS } from '@/config/mood';
import { TOOL_LABELS, type ToolId } from '@/config/tools';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { getRepo } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { parseToolParams, type ToolRouteParams } from '@/lib/sessionFlow';
import { useSettings } from '@/lib/SettingsContext';

type Params = ToolRouteParams & { tool?: ToolId; sessionId?: string };

export default function DoneScreen() {
  const theme = useTheme();
  const raw = useLocalSearchParams<Params>();
  const params = useMemo(() => parseToolParams(raw), [raw]);
  const tool = (raw.tool ?? 'breath') as ToolId;
  const { settings, update } = useSettings();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const goHome = async () => {
    if (!settings.onboardingDone) await update({ onboardingDone: true });
    router.replace('/(tabs)/home');
  };

  const save = async () => {
    setSaving(true);
    try {
      const repo = await getRepo();
      await repo.addSavedMethod({ title: `${TOOL_LABELS[tool]}이 도움이 됐어요`, note: note.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <AppText variant="display" accessibilityRole="header">
          잘 해냈어요
        </AppText>
        <AppText color="textSecondary">
          {params.before ? `"${MOOD_LABELS[params.before]}"에서 시작해 ` : ''}
          {TOOL_LABELS[tool]}로 잠시 숨을 돌렸어요. 이 순간을 기억해 두면 다음에도 꺼내 쓸 수 있어요.
        </AppText>
      </View>

      <Card>
        <AppText variant="bodyStrong">이 방법 담아두기</AppText>
        <AppText variant="caption" color="textSecondary">
          어떤 점이 도움이 됐는지 한 줄 남겨두면 홈에서 다시 볼 수 있어요. (선택)
        </AppText>
        {saved ? (
          <AppText color="primary">담아두었어요.</AppText>
        ) : (
          <>
            <TextInput
              accessibilityLabel="도움이 된 점 메모"
              placeholder="예: 날숨을 길게 하니 어깨가 풀렸다"
              placeholderTextColor={theme.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            />
            <BigButton title="담아두기" size="md" tone="secondary" onPress={save} disabled={saving} />
          </>
        )}
      </Card>

      <View style={{ flex: 1 }} />
      <BigButton title="홈으로" onPress={goHome} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: Spacing.two, marginTop: Spacing.four },
  input: {
    minHeight: MinTouch * 1.5,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.two,
    fontSize: 17,
    textAlignVertical: 'top',
  },
});
