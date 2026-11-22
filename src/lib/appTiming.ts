import { AppState } from 'react-native';

/**
 * "앱 실행부터 도구 시작까지 걸린 초" 측정.
 * cold start 와 foreground 복귀 모두 openedAt 을 갱신한다.
 */
let openedAt = Date.now();
let entry: string = 'unknown';
let subscribed = false;

export function initAppTiming() {
  if (subscribed) return;
  subscribed = true;
  openedAt = Date.now();
  AppState.addEventListener('change', (state) => {
    if (state === 'active') openedAt = Date.now();
  });
}

export function markToolEntry(source: string) {
  entry = source;
}

export function consumeToolEntry(): { secondsSinceOpen: number; entry: string } {
  const secondsSinceOpen = Math.round((Date.now() - openedAt) / 1000);
  const e = entry;
  entry = 'unknown';
  return { secondsSinceOpen, entry: e };
}
