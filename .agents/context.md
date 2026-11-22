# 쉼표 (Shimpyo) 프로젝트 컨텍스트

최종 업데이트: 2026-10-17

## 개요
- 정서 안정 앱 "쉼표" MVP. Expo SDK 58 / React Native 0.88 / Expo Router / TypeScript.
- 프로젝트 루트: `pj_shimpyo/` (2026-11-14 하위 `shimpyo/` 에서 이동). 개발 환경은 Docker(`docker-compose.yml`). compose 프로젝트명은 `name: shimpyo` 로 고정(기존 volume 유지).
- 서버 없음. 데이터는 기기 SQLite 에만 저장. 웹 미리보기는 메모리 저장소로 대체.

## 상태 (2026-10-17)
- 6단계 전부 1차 구현 완료: 구조/탭/테마 → 숨쉬기 → 곤지곤지 → 마음 체크·전후 흐름·저장 → 명상 → 나 탭·도움받을 곳·온보딩.
- 검증: 단위 테스트 25개 통과(pacer 18, hooks 7), `tsc --noEmit` 통과, `expo export --platform web` 성공.
- 실기기/시뮬레이터 실행은 아직 미확인 (Docker 에서는 네이티브 빌드 불가). 진동 체감 동기화는 기기에서 확인해야 함.

## 확정한 설계 결정
- expo-av 대신 **expo-audio** (SDK 53+ 권장). 백그라운드 재생: app.json 플러그인 `enableBackgroundPlayback` + `setAudioModeAsync({ shouldPlayInBackground: true })`.
- 진동은 "세기"만으로 구분이 불가능(iOS 5단계, Android 진폭 불가)해서 **리듬 + 세기 단계** 조합: 들숨 = Heavy 시작 + 매초 Light 틱, 날숨 = Soft 긴 시작 + 2초마다 Soft 틱, 멈춤 = Rigid 1회.
- 진동/애니메이션 동기화: `pacer/scheduler.ts` 가 세션 시작 시각 기준 절대 시각으로 타이머를 잡음(드리프트 누적 없음). 단계 전환 이벤트와 진동 cue 를 같은 콜백에서 내보내고, 화면은 `phaseKey` 변화에 `withTiming` 을 시작.
- 호흡 패턴 길이: 목표 길이에 가장 가까운 **정수 사이클 수로 반올림** (박스 1분 = 64초, 4-7-8 1분 = 57초). 화면에 실제 길이 표기.
- 곤지곤지 감속: 80→50 bpm 을 **전체 길이에 비례**해 선형 감속 (2분도 동일). 30초마다 손 바꾸기(3연속 진동). 잼잼은 쥐기/펴기 교대, 손 바꾸기 없음.
- 사후 체크 3지선다 → 전후 비교용 after level 환산: 네 = before-1, 아직 = before, 더 힘들어요 = before+1 (원 답변은 events 에 저장).
- "아직이요" 순환: 숨쉬기 → 곤지 → 명상 → …, `attempt >= 3` 이면 도움받을 곳 안내.
- "더 힘들어요": after 체크 저장 후 `/help` 로 이동.
- 무음 모드(기본 ON)는 숨쉬기/곤지 안내음에만 적용. 명상 음성은 항상 재생.
- 측정용 `events` 테이블 추가 (tool_started 의 secondsSinceOpen, tool_completed/abandoned, after_answer). 앱 실행 시각은 cold start + foreground 복귀 모두 갱신(`lib/appTiming.ts`).
- SQLCipher 암호화는 2단계로 미룸 (플러그인 `useSQLCipher: false`). 켤 때 expo-secure-store 에 키 보관 후 `PRAGMA key`.
- 탭은 `expo-router` 의 JS `Tabs` 사용 (NativeTabs 대신; 웹 호환과 FAB 겹침 제어 목적). 아이콘은 `@expo/vector-icons` Ionicons.
- 명상 placeholder 음성: `scripts/gen-audio-placeholders.js` 로 생성한 8kHz/8bit WAV (총 8MB). 실제 음성으로 교체 예정.

## 알려진 제약 / 다음 할 일
- iOS 는 화면 꺼짐/백그라운드에서 haptics 가 울리지 않음 → 숨쉬기/곤지는 화면 켠 상태 전제.
- 웹에서는 expo-sqlite 미설정(wasm) → MemoryRepo. 진동도 대부분 브라우저에서 무시됨.
- react-native-reanimated `useReducedMotion` 대응: 숨쉬기는 scale 대신 opacity, 곤지는 펄스 생략.
- 실기기 확인 항목: 진동-원 동기화 체감, Android `Vibration` 패턴 길이 적절성, 명상 백그라운드 재생/잠금화면 컨트롤, `tel:` 연결.
- 2단계 후보: SQLCipher, 커뮤니티(이겨낸 이야기) 연동, 실제 명상 음성, 홈 "담아둔 방법" 편집(메모 수정).
- 2026-11-14: 홈 "담아둔 방법" 삭제 추가 (확인 다이얼로그, 웹은 `window.confirm`). 미검증.

## 실행
`README.md` 참고. 요약: `.env` 에 `HOST_LAN_IP` → `docker compose run --rm app npm install` → `docker compose up` → Expo Go 로 QR.
