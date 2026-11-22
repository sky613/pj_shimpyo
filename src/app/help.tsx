import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { HELPLINES, MEDICAL_DISCLAIMER, type Helpline } from '@/config/helplines';
import { Spacing } from '@/constants/theme';

export default function HelpScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  const call = async (h: Helpline) => {
    const url = `tel:${h.dial}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert('전화 연결을 열 수 없어요', `직접 ${h.number} 로 전화해 주세요.`);
    }
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <View style={styles.top}>
        <AppText variant="display" accessibilityRole="header">
          도움받을 곳
        </AppText>
        <AppText color="textSecondary">
          {from === 'after'
            ? '지금 많이 힘들다면 혼자 견디지 않아도 괜찮아요. 한 번의 탭으로 바로 연결돼요.'
            : '힘든 순간에 바로 연락할 수 있는 곳이에요.'}
        </AppText>
      </View>

      {HELPLINES.map((h) => (
        <Card key={h.id} alt>
          <AppText variant="title">{h.name}</AppText>
          <AppText color="textSecondary">{h.description}</AppText>
          <AppText variant="caption" color="textSecondary">
            {h.hours}
          </AppText>
          <BigButton title={`${h.number} 전화하기`} onPress={() => call(h)} style={{ marginTop: Spacing.one }} />
        </Card>
      ))}

      <Card>
        <AppText variant="caption" color="textSecondary">
          {MEDICAL_DISCLAIMER}
        </AppText>
      </Card>

      <View style={{ flex: 1 }} />
      <BigButton title="닫기" tone="ghost" size="md" onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: Spacing.two, marginTop: Spacing.two },
});
