import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { MOOD_LABELS } from '@/config/mood';
import { TOOL_LABELS } from '@/config/tools';
import { Radius, Spacing } from '@/constants/theme';
import { getRepo, type SessionWithMood, type Stats } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort } from '@/lib/format';

const BAR_MAX = 72;

export default function MeScreen() {
  const theme = useTheme();
  const [rows, setRows] = useState<SessionWithMood[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const repo = await getRepo();
          const [list, s] = await Promise.all([repo.listSessionsWithMood(30), repo.getStats()]);
          if (alive) {
            setRows(list);
            setStats(s);
          }
        } catch {
          // ignore
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const paired = rows.filter((r) => r.before && r.after).slice(0, 10).reverse();

  return (
    <Screen bottomInset={96}>
      <AppText variant="display" accessibilityRole="header">
        나
      </AppText>

      <Card>
        <AppText variant="title" accessibilityRole="header">
          마음 기록
        </AppText>
        <AppText variant="caption" color="textSecondary">
          도구를 쓰기 전과 후의 긴장도(1~5). 낮을수록 편안한 상태예요.
        </AppText>
        {paired.length === 0 ? (
          <AppText color="textSecondary">아직 기록이 없어요. 홈에서 마음을 체크하고 도구를 써보면 여기에 쌓여요.</AppText>
        ) : (
          <View
            style={styles.chart}
            accessible
            accessibilityLabel={`최근 ${paired.length}회 기록. ${paired
              .map((p) => `${TOOL_LABELS[p.session.tool]} 전 ${p.before} 후 ${p.after}`)
              .join(', ')}`}>
            {paired.map((p) => (
              <View key={p.session.id} style={styles.pair}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: (BAR_MAX * (p.before ?? 0)) / 5, backgroundColor: theme.border }]} />
                  <View style={[styles.bar, { height: (BAR_MAX * (p.after ?? 0)) / 5, backgroundColor: theme.primary }]} />
                </View>
                <AppText variant="caption" color="textSecondary" center numberOfLines={1} style={styles.barLabel}>
                  {TOOL_LABELS[p.session.tool].slice(0, 2)}
                </AppText>
              </View>
            ))}
          </View>
        )}
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: theme.border }]} />
          <AppText variant="caption" color="textSecondary">
            전
          </AppText>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <AppText variant="caption" color="textSecondary">
            후
          </AppText>
        </View>
      </Card>

      {stats && stats.totalSessions > 0 ? (
        <Card alt>
          <AppText variant="bodyStrong">함께한 기록</AppText>
          <AppText color="textSecondary">도구를 끝까지 마친 비율 {Math.round((stats.completionRate ?? 0) * 100)}%</AppText>
          {stats.avgDelta !== null ? (
            <AppText color="textSecondary">
              긴장도 변화 평균 {stats.avgDelta > 0 ? '+' : ''}
              {stats.avgDelta.toFixed(1)}단계
            </AppText>
          ) : null}
          {stats.avgSecondsToStart !== null ? (
            <AppText color="textSecondary">앱을 열고 도구를 시작하기까지 평균 {Math.round(stats.avgSecondsToStart)}초</AppText>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.list}>
        <AppText variant="title" accessibilityRole="header">
          최근 사용
        </AppText>
        {rows.slice(0, 8).map((r) => (
          <Card key={r.session.id}>
            <View style={styles.rowBetween}>
              <AppText variant="bodyStrong">{TOOL_LABELS[r.session.tool]}</AppText>
              <AppText variant="caption" color="textSecondary">
                {formatDateShort(r.session.started_at)}
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary">
              {r.session.completed ? '끝까지 마침' : '중간에 멈춤'}
              {r.before ? ` · 전: ${MOOD_LABELS[r.before]}` : ''}
              {r.after ? ` → 후: ${MOOD_LABELS[r.after]}` : ''}
            </AppText>
          </Card>
        ))}
      </View>

      <BigButton title="설정" size="md" tone="secondary" onPress={() => router.push('/settings')} />
      <BigButton title="도움받을 곳" size="md" tone="ghost" onPress={() => router.push({ pathname: '/help', params: { from: 'me' } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: BAR_MAX + 28, marginTop: Spacing.two },
  pair: { flex: 1, alignItems: 'center', gap: Spacing.one },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_MAX },
  bar: { width: 10, borderRadius: Radius.sm, minHeight: 4 },
  barLabel: { fontSize: 11, lineHeight: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.two },
  list: { gap: Spacing.two },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
