import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const noop = () => () => {};

/**
 * 웹 정적 렌더링에서는 서버/클라이언트 색상 불일치를 피하기 위해
 * hydration 전까지 'light' 를 반환한다.
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const colorScheme = useRNColorScheme();
  return hydrated ? colorScheme : 'light';
}
