import { Platform } from 'react-native';

import { MemoryRepo } from './memoryRepo';
import type { Repo } from './types';

let repo: Repo | null = null;
let initPromise: Promise<Repo> | null = null;

/**
 * 네이티브는 expo-sqlite, 웹 미리보기는 메모리 저장소.
 * (웹에서 sqlite 를 쓰려면 wasm 설정이 필요해 MVP 범위에서 제외)
 */
export function getRepo(): Promise<Repo> {
  if (repo) return Promise.resolve(repo);
  if (!initPromise) {
    initPromise = (async () => {
      let r: Repo;
      if (Platform.OS === 'web') {
        r = new MemoryRepo();
      } else {
        const { SqliteRepo } = await import('./sqliteRepo');
        r = new SqliteRepo();
      }
      await r.init();
      repo = r;
      return r;
    })();
  }
  return initPromise;
}

export * from './types';
