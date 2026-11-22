import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markToolEntry } from '@/lib/appTiming';
import { useSettings } from '@/lib/SettingsContext';

const PAGES = [
  {
    emoji: '🌿',
    title: '불안이 올라오는 순간,\n1분이면 돼요',
    body: '쉼표는 숨과 손처럼 지금 바로 쓸 수 있는 몸의 방법으로 마음을 가라앉히도록 도와요.',
  },
  {
    emoji: '📳',
    title: '화면을 보지 않아도\n진동이 안내해요',
    body: '들숨과 날숨은 서로 다른 진동으로 구분돼요. 소리 없이, 눈을 감고도 따라할 수 있어요.',
  },
  {
    emoji: '🤲',
    title: '먼저 한 번\n같이 숨 쉬어 볼까요?',
    body: '1분 동안 원이 커지면 들이쉬고, 작아지면 내쉬세요. 기록은 이 기기에만 남아요.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { update } = useSettings();
  const [page, setPage] = useState(0);
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const pageWidth = Math.min(width, MaxContentWidth);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (p !== page) setPage(p);
  };

  const finish = async (tryBreath: boolean) => {
    await update({ onboardingDone: true });
    if (tryBreath) {
      markToolEntry('onboarding');
      router.replace({ pathname: '/tool/breath', params: { entry: 'onboarding', autostart: '1' } });
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const last = page === PAGES.length - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { width: pageWidth }]}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={styles.pager}>
          {PAGES.map((p, i) => (
            <View key={i} style={[styles.page, { width: pageWidth }]} accessible accessibilityLabel={`${i + 1}/${PAGES.length}. ${p.title.replace('\n', ' ')}. ${p.body}`}>
              <AppText style={styles.emoji} accessible={false}>
                {p.emoji}
              </AppText>
              <AppText variant="display" center>
                {p.title}
              </AppText>
              <AppText color="textSecondary" center>
                {p.body}
              </AppText>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots} accessibilityLabel={`${page + 1} / ${PAGES.length} 페이지`}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === page ? theme.primary : theme.border }]} />
          ))}
        </View>

        <View style={styles.actions}>
          {last ? (
            <BigButton title="1분 숨쉬기 체험하기" subtitle="진동과 함께 바로 시작" onPress={() => finish(true)} />
          ) : (
            <BigButton
              title="다음"
              onPress={() => {
                ref.current?.scrollTo({ x: (page + 1) * pageWidth, animated: true });
                setPage(page + 1);
              }}
            />
          )}
          <BigButton title={last ? '나중에 할게요' : '건너뛰기'} tone="ghost" size="md" onPress={() => finish(false)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center' },
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.five, gap: Spacing.four },
  emoji: { fontSize: 64, lineHeight: 76 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actions: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.four, gap: Spacing.two },
});
