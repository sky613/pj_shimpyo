import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { MoodPicker } from '@/components/MoodPicker';
import { Screen } from '@/components/Screen';
import { MOOD_LABELS, recommendTool, type MoodLevel } from '@/config/mood';
import { TOOL_DESCRIPTIONS, TOOL_LABELS, type ToolId } from '@/config/tools';
import { Spacing } from '@/constants/theme';
import { getRepo, type SavedMethodRow } from '@/db';
import { playHaptic } from '@/haptics/haptics';
import { markToolEntry } from '@/lib/appTiming';

const RECOMMEND_COPY: Record<ToolId, string> = {
  breath: '숨을 먼저 고르면 몸이 먼저 가라앉아요.',
  gonji: '손을 움직이면 생각에서 몸으로 돌아올 수 있어요.',
  meditation: '짧은 명상으로 지금의 편안함을 조금 더 머물게 해요.',
};

export default function HomeScreen() {
  const [level, setLevel] = useState<MoodLevel | null>(null);
  const [checkId, setCheckId] = useState<number | null>(null);
  const [saved, setSaved] = useState<SavedMethodRow[]>([]);

  const loadSaved = useCallback(
    (isAlive: () => boolean = () => true) =>
      getRepo()
        .then((r) => r.listSavedMethods())
        .then((rows) => isAlive() && setSaved(rows.slice(0, 3)))
        .catch(() => {}),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSaved(() => alive);
      // 홈으로 돌아오면 체크를 초기화해 새 흐름을 시작한다
      setLevel(null);
      setCheckId(null);
      return () => {
        alive = false;
      };
    }, [loadSaved]),
  );

  const removeSaved = (s: SavedMethodRow) => {
    const remove = () =>
      getRepo()
        .then((r) => r.deleteSavedMethod(s.id))
        .then(() => loadSaved())
        .catch(() => {});
    // react-native-web 의 Alert.alert 는 동작하지 않아 웹은 confirm 사용
    if (Platform.OS === 'web') {
      if (window.confirm('담아둔 방법을 지울까요?')) remove();
      return;
    }
    Alert.alert('담아둔 방법을 지울까요?', '지운 기록은 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: remove },
    ]);
  };

  const onPick = async (l: MoodLevel) => {
    playHaptic('select');
    setLevel(l);
    try {
      const repo = await getRepo();
      const id = await repo.addMoodCheck({ level: l, context: 'before', sessionId: null });
      setCheckId(id);
    } catch {
      setCheckId(null);
    }
  };

  const tool = level ? recommendTool(level) : null;

  const startTool = (t: ToolId) => {
    markToolEntry('home');
    const params = {
      entry: 'home',
      autostart: '1',
      ...(level ? { before: String(level) } : {}),
      ...(checkId ? { checkId: String(checkId) } : {}),
    };
    if (t === 'meditation') {
      router.push({ pathname: '/(tabs)/calm', params: { focus: 'meditation' } });
      return;
    }
    router.push({ pathname: t === 'breath' ? '/tool/breath' : '/tool/gonji', params });
  };

  return (
    <Screen bottomInset={96}>
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          지금 어때요?
        </AppText>
        <AppText color="textSecondary">하나를 고르면 맞는 방법을 알려드려요.</AppText>
      </View>

      <MoodPicker value={level} onChange={onPick} />

      {level && tool ? (
        <Card alt accessibilityLabel={`추천: ${TOOL_LABELS[tool]}`}>
          <AppText variant="caption" color="textSecondary">
            {MOOD_LABELS[level]} · 추천
          </AppText>
          <AppText variant="title">{TOOL_LABELS[tool]}</AppText>
          <AppText color="textSecondary">{RECOMMEND_COPY[tool]}</AppText>
          <BigButton
            title={`${TOOL_LABELS[tool]} 시작`}
            subtitle={tool === 'meditation' ? '3·5·10분 중 고르기' : '1분'}
            onPress={() => startTool(tool)}
            style={{ marginTop: Spacing.two }}
          />
        </Card>
      ) : (
        <Card>
          <AppText color="textSecondary">
            바로 시작하고 싶다면 오른쪽 아래 <AppText variant="bodyStrong">지금 숨쉬기</AppText> 를 눌러요.
          </AppText>
        </Card>
      )}

      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">
          다른 방법
        </AppText>
        {(['breath', 'gonji', 'meditation'] as ToolId[])
          .filter((t) => t !== tool)
          .map((t) => (
            <Card key={t} onPress={() => startTool(t)} accessibilityLabel={`${TOOL_LABELS[t]}, ${TOOL_DESCRIPTIONS[t]}`}>
              <AppText variant="bodyStrong">{TOOL_LABELS[t]}</AppText>
              <AppText variant="caption" color="textSecondary">
                {TOOL_DESCRIPTIONS[t]}
              </AppText>
            </Card>
          ))}
      </View>

      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">
          내가 담아둔 방법
        </AppText>
        {saved.length === 0 ? (
          <AppText color="textSecondary">도구를 마친 뒤 「담아두기」를 누르면 여기에 모여요.</AppText>
        ) : (
          saved.map((s) => (
            <Card key={s.id}>
              <AppText variant="bodyStrong">{s.title}</AppText>
              {s.note ? <AppText color="textSecondary">{s.note}</AppText> : null}
              <BigButton
                title="지우기"
                size="md"
                tone="ghost"
                accessibilityLabel={`${s.title} 지우기`}
                onPress={() => removeSaved(s)}
              />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one },
  section: { gap: Spacing.two, marginTop: Spacing.two },
});
