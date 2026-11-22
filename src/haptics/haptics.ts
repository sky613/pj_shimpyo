import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

import type { BreathHapticCue } from '@/pacer/breathSchedule';
import type { GonjiHapticCue } from '@/pacer/gonjiSchedule';

export type HapticCue = BreathHapticCue | GonjiHapticCue | 'complete' | 'select';
export type HapticStrength = 'soft' | 'normal' | 'strong';

/**
 * 플랫폼 제약:
 * - iOS: expo-haptics 의 Light/Medium/Heavy/Soft/Rigid 만 가능 (진폭 직접 제어 불가)
 * - Android: Vibration.vibrate 로 길이/패턴 제어 (진폭은 네이티브 없이 불가)
 * 그래서 들숨/날숨은 "리듬 + 세기 단계" 조합으로 구분한다.
 */
interface CueSpec {
  ios: Haptics.ImpactFeedbackStyle | 'notification-success' | 'selection';
  /** Android 진동 패턴 (ms). 홀수 인덱스가 진동 길이 */
  android: number[];
}

const SPEC: Record<HapticCue, CueSpec> = {
  // 들숨: 또렷한 시작 + 매초 짧은 틱
  inhaleStart: { ios: Haptics.ImpactFeedbackStyle.Heavy, android: [0, 60, 60, 60] },
  inhaleTick: { ios: Haptics.ImpactFeedbackStyle.Light, android: [0, 25] },
  // 멈춤: 단단한 한 번
  holdStart: { ios: Haptics.ImpactFeedbackStyle.Rigid, android: [0, 40] },
  // 날숨: 길고 부드러운 시작 + 2초마다 아주 짧은 틱
  exhaleStart: { ios: Haptics.ImpactFeedbackStyle.Soft, android: [0, 220] },
  exhaleTick: { ios: Haptics.ImpactFeedbackStyle.Soft, android: [0, 15] },
  // 곤지곤지 박자
  beat: { ios: Haptics.ImpactFeedbackStyle.Medium, android: [0, 45] },
  beatSoft: { ios: Haptics.ImpactFeedbackStyle.Light, android: [0, 25] },
  // 손 바꾸기: 다른 패턴 (세 번 연속)
  switchHands: { ios: Haptics.ImpactFeedbackStyle.Heavy, android: [0, 80, 80, 80, 80, 80] },
  complete: { ios: 'notification-success', android: [0, 50, 100, 50, 100, 120] },
  select: { ios: 'selection', android: [0, 15] },
};

const STRENGTH_SCALE: Record<HapticStrength, number> = { soft: 0.6, normal: 1, strong: 1.5 };

const IOS_STEP_DOWN: Partial<Record<Haptics.ImpactFeedbackStyle, Haptics.ImpactFeedbackStyle>> = {
  [Haptics.ImpactFeedbackStyle.Heavy]: Haptics.ImpactFeedbackStyle.Medium,
  [Haptics.ImpactFeedbackStyle.Medium]: Haptics.ImpactFeedbackStyle.Light,
  [Haptics.ImpactFeedbackStyle.Rigid]: Haptics.ImpactFeedbackStyle.Medium,
  [Haptics.ImpactFeedbackStyle.Light]: Haptics.ImpactFeedbackStyle.Soft,
};
const IOS_STEP_UP: Partial<Record<Haptics.ImpactFeedbackStyle, Haptics.ImpactFeedbackStyle>> = {
  [Haptics.ImpactFeedbackStyle.Soft]: Haptics.ImpactFeedbackStyle.Light,
  [Haptics.ImpactFeedbackStyle.Light]: Haptics.ImpactFeedbackStyle.Medium,
  [Haptics.ImpactFeedbackStyle.Medium]: Haptics.ImpactFeedbackStyle.Heavy,
};

function scaleIos(style: Haptics.ImpactFeedbackStyle, strength: HapticStrength) {
  if (strength === 'soft') return IOS_STEP_DOWN[style] ?? style;
  if (strength === 'strong') return IOS_STEP_UP[style] ?? style;
  return style;
}

let enabled = true;

/** 설정 화면이나 세션 중 토글용 */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function playHaptic(cue: HapticCue, strength: HapticStrength = 'normal'): void {
  if (!enabled) return;
  const spec = SPEC[cue];
  try {
    if (Platform.OS === 'ios') {
      if (spec.ios === 'notification-success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (spec.ios === 'selection') {
        void Haptics.selectionAsync();
      } else {
        void Haptics.impactAsync(scaleIos(spec.ios, strength));
      }
      return;
    }
    if (Platform.OS === 'android') {
      const scale = STRENGTH_SCALE[strength];
      const pattern = spec.android.map((ms, i) => (i % 2 === 1 ? Math.round(ms * scale) : ms));
      Vibration.vibrate(pattern, false);
      return;
    }
    // web: Vibration API 가 있을 때만
    if (Platform.OS === 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  } catch {
    // 진동 실패는 사용자 흐름을 막지 않는다
  }
}

export function cancelHaptics() {
  if (Platform.OS === 'android') Vibration.cancel();
}
