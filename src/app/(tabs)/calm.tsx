import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ToggleRow } from '@/components/ToggleRow';
import {
  MEDITATION_MINUTES,
  MEDITATION_TAG_LABELS,
  MEDITATIONS,
  type MeditationMinutes,
  type MeditationTag,
} from '@/config/meditations';
import { TOOL_DESCRIPTIONS, TOOL_LABELS } from '@/config/tools';
import { Spacing } from '@/constants/theme';
import { markToolEntry } from '@/lib/appTiming';
import { useSettings } from '@/lib/SettingsContext';
import { useTheme } from '@/hooks/use-theme';

type MinuteFilter = MeditationMinutes | 0;

export default function CalmScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();
  const params = useLocalSearchParams<{ before?: string; checkId?: string }>();
  const [minutes, setMinutes] = useState<MinuteFilter>(0);
  const [tag, setTag] = useState<MeditationTag | null>(null);

  const passThrough = {
    entry: 'calm',
    ...(params.before ? { before: params.before } : {}),
    ...(params.checkId ? { checkId: params.checkId } : {}),
  };

  const filtered = MEDITATIONS.filter((m) => (minutes === 0 || m.minutes === minutes) && (!tag || m.tags.includes(tag)));

  return (
    <Screen bottomInset={96}>
      <AppText variant="display" accessibilityRole="header">
        진정하기
      </AppText>

      <Card>
        <ToggleRow
          label="무음 모드"
          description="소리 없이 진동과 화면만으로 안내해요"
          value={settings.silentMode}
          onChange={(v) => update({ silentMode: v })}
        />
      </Card>

      <View style={styles.section}>
        <Card
          onPress={() => {
            markToolEntry('calm');
            router.push({ pathname: '/tool/breath', params: passThrough });
          }}
          accessibilityLabel={`${TOOL_LABELS.breath}, ${TOOL_DESCRIPTIONS.breath}`}>
          <AppText variant="title">{TOOL_LABELS.breath}</AppText>
          <AppText color="textSecondary">{TOOL_DESCRIPTIONS.breath}</AppText>
          <AppText variant="caption" color="textSecondary">
            4-6 · 박스 · 4-7-8 / 1분 · 3분
          </AppText>
        </Card>
        <Card
          onPress={() => {
            markToolEntry('calm');
            router.push({ pathname: '/tool/gonji', params: passThrough });
          }}
          accessibilityLabel={`${TOOL_LABELS.gonji}, ${TOOL_DESCRIPTIONS.gonji}`}>
          <AppText variant="title">{TOOL_LABELS.gonji}</AppText>
          <AppText color="textSecondary">{TOOL_DESCRIPTIONS.gonji}</AppText>
          <AppText variant="caption" color="textSecondary">
            곤지곤지 · 잼잼 / 1분 · 2분
          </AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">
          명상
        </AppText>
        <Segmented<MinuteFilter>
          accessibilityLabel="명상 길이"
          value={minutes}
          onChange={setMinutes}
          options={[{ value: 0, label: '전체' }, ...MEDITATION_MINUTES.map((m) => ({ value: m, label: `${m}분` }))]}
        />
        <View style={styles.tags}>
          {(Object.keys(MEDITATION_TAG_LABELS) as MeditationTag[]).map((t) => {
            const on = tag === t;
            return (
              <Card
                key={t}
                onPress={() => setTag(on ? null : t)}
                accessibilityLabel={`${MEDITATION_TAG_LABELS[t]} 필터${on ? ', 선택됨' : ''}`}
                style={[styles.tag, on && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                <AppText variant="caption" style={{ color: on ? theme.onPrimary : theme.text }}>
                  {MEDITATION_TAG_LABELS[t]}
                </AppText>
              </Card>
            );
          })}
        </View>
        {filtered.length === 0 ? (
          <AppText color="textSecondary">조건에 맞는 명상이 없어요. 필터를 바꿔 보세요.</AppText>
        ) : (
          filtered.map((m) => (
            <Card
              key={m.id}
              onPress={() => {
                markToolEntry('calm');
                router.push({ pathname: '/tool/meditation/[id]', params: { id: m.id, ...passThrough } });
              }}
              accessibilityLabel={`${m.title}, ${m.minutes}분, ${m.subtitle}`}>
              <View style={styles.rowBetween}>
                <AppText variant="bodyStrong">{m.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {m.minutes}분
                </AppText>
              </View>
              <AppText variant="caption" color="textSecondary">
                {m.subtitle}
              </AppText>
              <AppText variant="caption" color="primary">
                {m.tags.map((t) => MEDITATION_TAG_LABELS[t]).join(' · ')}
              </AppText>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginTop: Spacing.two },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tag: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, minHeight: 48, justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
