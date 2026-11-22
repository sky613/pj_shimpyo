import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

interface HandIllustrationProps {
  /** 손바닥 펄스 (1 = 기본) */
  pulse: SharedValue<number>;
  /** 잼잼: 0 = 펴기, 1 = 쥐기 */
  fist: SharedValue<number>;
  side: 'left' | 'right' | 'both';
}

const FINGERS = [
  { left: 18, top: 28, h: 64, rotate: '-14deg' },
  { left: 52, top: 6, h: 84, rotate: '-5deg' },
  { left: 88, top: 0, h: 92, rotate: '0deg' },
  { left: 124, top: 10, h: 82, rotate: '6deg' },
];

/** 단순한 View 조합으로 그린 손바닥 (이미지 없이 테마 색 반영) */
export function HandIllustration({ pulse, fist, side }: HandIllustrationProps) {
  const theme = useTheme();
  const wrap = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { scaleX: side === 'left' ? -1 : 1 }],
  }));
  const fingers = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 - fist.value * 0.55 }, { translateY: fist.value * 26 }],
  }));

  return (
    <Animated.View style={[styles.wrap, wrap]} accessible accessibilityLabel={side === 'both' ? '양손 그림' : side === 'left' ? '왼손 손바닥' : '오른손 손바닥'}>
      <Animated.View style={[styles.fingerLayer, fingers]}>
        {FINGERS.map((f, i) => (
          <View
            key={i}
            style={[
              styles.finger,
              { left: f.left, top: f.top, height: f.h, backgroundColor: theme.breathCircle, transform: [{ rotate: f.rotate }] },
            ]}
          />
        ))}
      </Animated.View>
      <View style={[styles.thumb, { backgroundColor: theme.breathCircle }]} />
      <View style={[styles.palm, { backgroundColor: theme.breathCircle }]} />
      <View style={[styles.palmShade, { backgroundColor: theme.breathCircleOuter }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 190, height: 230 },
  fingerLayer: { position: 'absolute', left: 8, top: 0, width: 170, height: 110 },
  finger: { position: 'absolute', width: 34, borderRadius: 17 },
  thumb: { position: 'absolute', left: -6, top: 112, width: 40, height: 84, borderRadius: 20, transform: [{ rotate: '34deg' }] },
  palm: { position: 'absolute', left: 22, top: 78, width: 148, height: 150, borderRadius: 64 },
  palmShade: { position: 'absolute', left: 70, top: 132, width: 64, height: 64, borderRadius: 32, opacity: 0.8 },
});
