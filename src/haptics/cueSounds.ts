import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * 무음 모드가 꺼졌을 때만 재생하는 짧은 안내음.
 * 파일은 assets/audio 의 placeholder 를 교체하면 된다.
 */
export type CueSound = 'tick' | 'chime';

const SOURCES: Record<CueSound, number> = {
  tick: require('@/assets/audio/cue-tick.wav'),
  chime: require('@/assets/audio/cue-chime.wav'),
};

const players: Partial<Record<CueSound, AudioPlayer>> = {};

export function playCueSound(sound: CueSound) {
  try {
    let p = players[sound];
    if (!p) {
      p = createAudioPlayer(SOURCES[sound]);
      players[sound] = p;
    }
    p.seekTo(0);
    p.play();
  } catch {
    // 오디오 실패는 무시
  }
}

export function releaseCueSounds() {
  for (const key of Object.keys(players) as CueSound[]) {
    try {
      players[key]?.remove();
    } catch {
      // ignore
    }
    delete players[key];
  }
}
