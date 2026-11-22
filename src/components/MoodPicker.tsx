import { Pressable, StyleSheet, View } from 'react-native';

import { MOOD_EMOJI, MOOD_LABELS, MOOD_LEVELS, type MoodLevel } from '@/config/mood';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './AppText';

interface MoodPickerProps {
  value: MoodLevel | null;
  onChange: (level: MoodLevel) => void;
}

/** 5단계 마음 체크. 한 번의 탭으로 선택된다. */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="지금 마음 상태" style={styles.wrap}>
      {MOOD_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${level}단계, ${MOOD_LABELS[level]}`}
            onPress={() => onChange(level)}
            style={({ pressed }) => [
              styles.item,
              { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border },
              pressed && styles.pressed,
            ]}>
            <AppText variant="display" style={styles.emoji} accessible={false}>
              {MOOD_EMOJI[level]}
            </AppText>
            <AppText variant="caption" style={{ color: selected ? theme.onPrimary : theme.textSecondary }} center numberOfLines={2}>
              {MOOD_LABELS[level]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: Spacing.two },
  item: {
    flex: 1,
    minHeight: MinTouch * 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.half,
    gap: Spacing.one,
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  pressed: { opacity: 0.8 },
});
