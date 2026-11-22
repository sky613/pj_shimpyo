import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ToggleRow } from '@/components/ToggleRow';
import { MEDICAL_DISCLAIMER } from '@/config/helplines';
import { GONJI_DEFAULTS } from '@/config/tools';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { playHaptic, type HapticStrength } from '@/haptics/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/SettingsContext';

const STEP = 5;

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const theme = useTheme();
  const btn = (text: string, delta: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${delta > 0 ? '늘리기' : '줄이기'}`}
      disabled={disabled}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={[styles.stepBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }, disabled && { opacity: 0.4 }]}>
      <AppText variant="title">{text}</AppText>
    </Pressable>
  );
  return (
    <View style={styles.stepRow}>
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      {btn('−', -STEP, value - STEP < min)}
      <AppText variant="title" style={styles.stepValue} accessibilityLabel={`${label} 분당 ${value}회`}>
        {value}
      </AppText>
      {btn('+', STEP, value + STEP > max)}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, update } = useSettings();

  const setStart = (v: number) => update({ gonjiStartBpm: v, gonjiEndBpm: Math.min(settings.gonjiEndBpm, v) });
  const setEnd = (v: number) => update({ gonjiEndBpm: v, gonjiStartBpm: Math.max(settings.gonjiStartBpm, v) });

  return (
    <Screen>
      <AppText variant="display" accessibilityRole="header">
        설정
      </AppText>

      <Card>
        <ToggleRow
          label="무음 모드 기본값"
          description="앱을 열 때 무음 모드로 시작해요. 진정하기 탭에서 그때그때 바꿀 수 있어요."
          value={settings.silentDefault}
          onChange={(v) => update({ silentDefault: v, silentMode: v })}
        />
      </Card>

      <Card>
        <AppText variant="bodyStrong">진동 세기</AppText>
        <Segmented<HapticStrength>
          accessibilityLabel="진동 세기"
          value={settings.hapticStrength}
          onChange={(v) => {
            void update({ hapticStrength: v });
            setTimeout(() => playHaptic('inhaleStart', v), 50);
          }}
          options={[
            { value: 'soft', label: '약하게' },
            { value: 'normal', label: '보통' },
            { value: 'strong', label: '강하게' },
          ]}
        />
        <AppText variant="caption" color="textSecondary">
          iOS 는 기기 특성상 세 단계로만 구분돼요.
        </AppText>
      </Card>

      <Card>
        <AppText variant="bodyStrong">곤지곤지 박자 (분당 횟수)</AppText>
        <AppText variant="caption" color="textSecondary">
          시작 박자에서 끝 박자로 전체 시간에 걸쳐 천천히 느려져요.
        </AppText>
        <Stepper label="시작" value={settings.gonjiStartBpm} onChange={setStart} min={GONJI_DEFAULTS.minBpm} max={GONJI_DEFAULTS.maxBpm} />
        <Stepper label="끝" value={settings.gonjiEndBpm} onChange={setEnd} min={GONJI_DEFAULTS.minBpm} max={GONJI_DEFAULTS.maxBpm} />
        <BigButton
          title="기본값으로"
          size="md"
          tone="ghost"
          onPress={() => update({ gonjiStartBpm: GONJI_DEFAULTS.startBpm, gonjiEndBpm: GONJI_DEFAULTS.endBpm })}
        />
      </Card>

      <Card>
        <BigButton
          title="처음 안내 다시 보기"
          size="md"
          tone="secondary"
          onPress={async () => {
            await update({ onboardingDone: false });
            router.replace('/onboarding');
          }}
        />
      </Card>

      <Card>
        <AppText variant="caption" color="textSecondary">
          {MEDICAL_DISCLAIMER}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          모든 기록은 이 기기 안에만 저장되며 서버로 전송되지 않아요.
        </AppText>
      </Card>

      <BigButton title="돌아가기" tone="ghost" size="md" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/me'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: { width: MinTouch, height: MinTouch, borderRadius: Radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 56, textAlign: 'center' },
});
