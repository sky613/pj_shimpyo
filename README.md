# 쉼표 (Shimpyo) — MVP

불안과 긴장이 올라오는 순간, 1분 안에 몸(숨, 손)으로 진정하게 돕는 앱.
서버 없음. 모든 데이터는 기기(SQLite)에만 저장된다.

## 개발 환경 (Docker)

Metro(Expo dev server)는 컨테이너에서 돌고, 앱은 휴대폰의 Expo Go 또는 브라우저에서 본다.

```bash
# 1) Mac 의 LAN IP 를 .env 에 넣는다 (휴대폰이 컨테이너의 Metro 에 접근하기 위해)
cp .env.example .env           # HOST_LAN_IP=$(ipconfig getifaddr en0)

# 2) 의존성 설치 (named volume 에 설치됨)
docker compose run --rm app npm install

# 3) placeholder 오디오 생성 (최초 1회, assets/audio 비어 있을 때)
docker compose run --rm app node scripts/gen-audio-placeholders.js

# 4) dev server
docker compose up
```

- 터미널의 QR 을 Expo Go 로 스캔하거나, `exp://<HOST_LAN_IP>:8081` 로 접속한다.
- 웹 미리보기: http://localhost:8081 (브라우저에서 `w` 키 또는 직접 접속). 웹은 진동이 없고 저장소는 메모리로 대체된다.

### 검증 명령

```bash
docker compose run --rm app npm test          # 단위 테스트 (pacer, hooks)
docker compose run --rm app npm run typecheck # tsc --noEmit
docker compose run --rm app npx expo lint
docker compose run --rm app npx expo export --platform web   # 번들 검증
```

### 네이티브 빌드

Docker 안에서는 iOS/Android 네이티브 빌드를 할 수 없다.
`expo-audio` 백그라운드 재생과 `expo-sqlite` 는 Expo Go 에서도 동작하지만, 백그라운드 오디오 설정이 완전히 반영된 빌드는
호스트(macOS + Xcode) 에서 `npx expo run:ios` 또는 EAS(`eas build --profile development`) 로 만든다.

## 구조

```
src/
  app/                     Expo Router 라우트
    _layout.tsx            루트 Stack + SettingsProvider
    index.tsx              온보딩 여부에 따라 리다이렉트
    (tabs)/                홈 / 진정하기 / 이겨낸 이야기 / 나  (+ 플로팅 "지금 숨쉬기")
    tool/breath.tsx        숨쉬기
    tool/gonji.tsx         손 곤지곤지 / 잼잼
    tool/meditation/[id]   명상 플레이어 (expo-audio)
    tool/after.tsx         "조금 나아졌나요?" 사후 체크
    tool/done.tsx          완료 + 담아두기
    onboarding.tsx  help.tsx  settings.tsx
  pacer/                   순수 타이밍 로직 (UI 없음, 단위 테스트 대상)
    scheduler.ts           드리프트 보정 스케줄러 (절대 시각 기준)
    breathSchedule.ts      호흡 패턴 → 단계/틱 이벤트
    gonjiSchedule.ts       박자 감속 + 손 바꾸기 이벤트
  hooks/useBreathPacer.ts  useGonjiPacer.ts  useCuePlayer.ts
  haptics/                 cue → 플랫폼별 진동 매핑, 안내음
  db/                      SQLite repo (네이티브) / Memory repo (웹), 통계
  config/                  tools(패턴·박자 상수) / mood / meditations / helplines
  lib/                     세션 흐름, 설정 컨텍스트, 앱 실행 시각 측정
assets/audio/              명상 음성 placeholder (교체 가능)
```

## 음성 파일 교체

`assets/audio/*.wav` 를 같은 파일명의 실제 음성으로 바꾸거나, `src/config/meditations.ts` 의 `source` 경로를 수정한다.
# pj_shimpyo
