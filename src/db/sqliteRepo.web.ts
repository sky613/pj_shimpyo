import { MemoryRepo } from './memoryRepo';

/**
 * 웹 번들에서는 expo-sqlite(wasm) 를 끌어오지 않도록 메모리 저장소로 대체한다.
 * (Metro 가 .web.ts 를 우선 해석)
 */
export class SqliteRepo extends MemoryRepo {}
