import { Redirect } from 'expo-router';

import { useSettings } from '@/lib/SettingsContext';

/** 첫 실행이면 온보딩, 아니면 홈 탭 */
export default function Index() {
  const { settings } = useSettings();
  return <Redirect href={settings.onboardingDone ? '/(tabs)/home' : '/onboarding'} />;
}
