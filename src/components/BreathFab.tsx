import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playHaptic } from '@/haptics/haptics';
import { markToolEntry } from '@/lib/appTiming';

import { AppText } from './AppText';

/** 플로팅 버튼 "지금 숨쉬기" — 어느 탭에서든 1탭으로 1분 숨쉬기 시작 */
export const FAB_HEIGHT = 60;

export function BreathFab({ bottomOffset }: { bottomOffset: number }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="지금 숨쉬기, 1분 숨쉬기를 바로 시작합니다"
      onPress={() => {
        playHaptic('select');
        markToolEntry('fab');
        router.push({ pathname: '/tool/breath', params: { entry: 'fab', autostart: '1' } });
      }}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.primaryStrong, bottom: bottomOffset + insets.bottom + Spacing.three, shadowColor: '#000' },
        pressed && styles.pressed,
      ]}>
      <AppText variant="bodyStrong" style={{ color: theme.onPrimary }}>
        지금 숨쉬기
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    height: FAB_HEIGHT,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: { opacity: 0.85 },
});
