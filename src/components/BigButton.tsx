import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './AppText';

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger';

interface BigButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  subtitle?: string;
  tone?: Tone;
  size?: 'lg' | 'md';
  style?: StyleProp<ViewStyle>;
}

/** 큰 터치 영역의 기본 버튼. 화면당 행동 하나 원칙에서 주 버튼으로 쓴다. */
export function BigButton({ title, subtitle, tone = 'primary', size = 'lg', style, disabled, ...rest }: BigButtonProps) {
  const theme = useTheme();
  const bg =
    tone === 'primary' ? theme.primary : tone === 'danger' ? theme.danger : tone === 'secondary' ? theme.surfaceAlt : 'transparent';
  const fg = tone === 'primary' || tone === 'danger' ? theme.onPrimary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: bg, borderColor: tone === 'ghost' ? theme.border : bg },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      <AppText variant={size === 'lg' ? 'title' : 'bodyStrong'} style={{ color: fg }} center>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" style={{ color: fg, opacity: 0.85 }} center>
          {subtitle}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MinTouch,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
  },
  lg: { paddingVertical: Spacing.four, minHeight: 72 },
  md: { paddingVertical: Spacing.three, minHeight: 56 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
