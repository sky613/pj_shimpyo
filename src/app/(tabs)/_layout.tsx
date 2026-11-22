import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { BreathFab } from '@/components/BreathFab';
import { useTheme } from '@/hooks/use-theme';

const TAB_BAR_HEIGHT = Platform.select({ ios: 56, default: 64 });

export default function TabLayout() {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primaryStrong,
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            height: TAB_BAR_HEIGHT + 24,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
          sceneStyle: { backgroundColor: theme.background },
        }}>
        <Tabs.Screen name="home" options={{ title: '홈', tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name="home-outline" size={size + 2} color={color as string} />, tabBarAccessibilityLabel: '홈 탭' }} />
        <Tabs.Screen name="calm" options={{ title: '진정하기', tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name="leaf-outline" size={size + 2} color={color as string} />, tabBarAccessibilityLabel: '진정하기 탭' }} />
        <Tabs.Screen name="stories" options={{ title: '이겨낸 이야기', tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name="chatbubbles-outline" size={size + 2} color={color as string} />, tabBarAccessibilityLabel: '이겨낸 이야기 탭' }} />
        <Tabs.Screen name="me" options={{ title: '나', tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name="person-outline" size={size + 2} color={color as string} />, tabBarAccessibilityLabel: '나 탭' }} />
      </Tabs>
      <BreathFab bottomOffset={TAB_BAR_HEIGHT + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
