import { StyleSheet, Text, type TextProps } from 'react-native';

import { TextSizes, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: keyof typeof TextSizes;
  color?: ThemeColor;
  center?: boolean;
};

/** 시스템 글자 크기를 그대로 반영한다 (allowFontScaling 기본값 true) */
export function AppText({ style, variant = 'body', color = 'text', center, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[TextSizes[variant], { color: theme[color] }, center && styles.center, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
