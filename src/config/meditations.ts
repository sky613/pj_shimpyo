/**
 * 명상 콘텐츠 목록. 음성 파일은 assets/audio 의 placeholder 를 교체하면 된다.
 * (파일명을 바꾸면 여기 require 경로만 수정)
 */
export type MeditationTag = 'commute' | 'beforeTalk' | 'beforeSleep' | 'angry';

export const MEDITATION_TAG_LABELS: Record<MeditationTag, string> = {
  commute: '출근길',
  beforeTalk: '발표 전',
  beforeSleep: '잠들기 전',
  angry: '화가 났을 때',
};

export const MEDITATION_MINUTES = [3, 5, 10] as const;
export type MeditationMinutes = (typeof MEDITATION_MINUTES)[number];

export interface Meditation {
  id: string;
  title: string;
  subtitle: string;
  minutes: MeditationMinutes;
  tags: MeditationTag[];
  /** expo-audio 가 재생할 소스 */
  source: number;
}

export const MEDITATIONS: Meditation[] = [
  {
    id: 'body-scan',
    title: '바디스캔',
    subtitle: '머리부터 발끝까지 몸의 감각을 천천히 살펴요',
    minutes: 5,
    tags: ['beforeTalk', 'angry'],
    source: require('@/assets/audio/body-scan.wav'),
  },
  {
    id: 'sense-focus',
    title: '감각 집중',
    subtitle: '지금 들리는 소리, 닿는 감촉에 머물러요',
    minutes: 3,
    tags: ['commute', 'beforeTalk', 'angry'],
    source: require('@/assets/audio/sense-focus.wav'),
  },
  {
    id: 'before-sleep',
    title: '잠들기 전',
    subtitle: '하루를 내려놓고 몸을 느슨하게 풀어요',
    minutes: 10,
    tags: ['beforeSleep'],
    source: require('@/assets/audio/before-sleep.wav'),
  },
];

export function findMeditation(id: string | undefined): Meditation | undefined {
  return MEDITATIONS.find((m) => m.id === id);
}
