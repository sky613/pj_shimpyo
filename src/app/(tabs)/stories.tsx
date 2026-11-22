import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Spacing } from '@/constants/theme';

export default function StoriesScreen() {
  return (
    <Screen bottomInset={96}>
      <AppText variant="display" accessibilityRole="header">
        이겨낸 이야기
      </AppText>
      <Card alt style={styles.card}>
        <AppText variant="display" center accessible={false}>
          🌱
        </AppText>
        <AppText variant="title" center>
          곧 열려요
        </AppText>
        <AppText color="textSecondary" center>
          비슷한 순간을 지나온 사람들의 방법을 서로 나누는 공간을 준비하고 있어요.
        </AppText>
        <View style={styles.gap} />
        <AppText variant="caption" color="textSecondary" center>
          지금은 「나」 탭에서 내 기록을 돌아볼 수 있어요.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.three },
  gap: { height: Spacing.two },
});
