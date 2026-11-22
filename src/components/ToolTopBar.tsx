import { Pressable, StyleSheet, View } from 'react-native';

import { MinTouch, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './AppText';

interface ToolTopBarProps {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  onClose: () => void;
}

export function ToolTopBar({ title, rightLabel, onRightPress, onClose }: ToolTopBarProps) {
  const theme = useTheme();
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="그만하기" onPress={onClose} style={styles.btn}>
        <AppText variant="bodyStrong" color="textSecondary">
          그만하기
        </AppText>
      </Pressable>
      <AppText variant="bodyStrong" accessibilityRole="header">
        {title}
      </AppText>
      {rightLabel && onRightPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={rightLabel} onPress={onRightPress} style={styles.btn}>
          <AppText variant="bodyStrong" style={{ color: theme.primaryStrong }}>
            {rightLabel}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { minHeight: MinTouch, minWidth: 72, justifyContent: 'center', paddingHorizontal: Spacing.one },
});
