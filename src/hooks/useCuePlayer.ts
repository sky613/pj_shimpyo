import { useCallback, useEffect } from 'react';

import { playCueSound, releaseCueSounds } from '@/haptics/cueSounds';
import { playHaptic, type HapticCue } from '@/haptics/haptics';
import { useSettings } from '@/lib/SettingsContext';

/**
 * 설정(무음 모드, 진동 세기)을 반영해 진동과 안내음을 함께 낸다.
 * 무음 모드가 기본이며, 꺼졌을 때만 단계 시작에 짧은 소리를 더한다.
 */
export function useCuePlayer() {
  const { settings } = useSettings();
  const { silentMode, hapticStrength } = settings;

  useEffect(() => () => releaseCueSounds(), []);

  return useCallback(
    (cue: HapticCue) => {
      playHaptic(cue, hapticStrength);
      if (silentMode) return;
      if (cue === 'inhaleStart' || cue === 'exhaleStart' || cue === 'switchHands') playCueSound('tick');
      if (cue === 'complete') playCueSound('chime');
    },
    [silentMode, hapticStrength],
  );
}
