import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  const theme = useTheme();
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
