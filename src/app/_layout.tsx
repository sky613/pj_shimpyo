import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initAppTiming } from '@/lib/appTiming';
import { SettingsProvider, useSettings } from '@/lib/SettingsContext';

SplashScreen.preventAutoHideAsync();
initAppTiming();

function Root() {
  const scheme = useColorScheme();
  const { ready } = useSettings();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="tool/breath" options={{ gestureEnabled: false }} />
        <Stack.Screen name="tool/gonji" options={{ gestureEnabled: false }} />
        <Stack.Screen name="tool/meditation/[id]" />
        <Stack.Screen name="tool/after" options={{ gestureEnabled: false }} />
        <Stack.Screen name="tool/done" options={{ gestureEnabled: false }} />
        <Stack.Screen name="help" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
