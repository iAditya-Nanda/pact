import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

let isMuted = false;

export function setVoiceMuted(muted: boolean) {
  isMuted = muted;
  if (muted) {
    Speech.stop();
  }
}

export function getVoiceMuted(): boolean {
  return isMuted;
}

export async function speakVoice(
  text: string,
  onStart?: () => void,
  onDone?: () => void
) {
  if (isMuted || !text) {
    if (onDone) onDone();
    return;
  }

  try {
    Speech.stop();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      onStart: () => {
        if (onStart) onStart();
      },
      onDone: () => {
        if (onDone) onDone();
      },
      onError: () => {
        if (onDone) onDone();
      },
    });
  } catch (err) {
    console.warn('[Voice] Speech synthesis error:', err);
    if (onDone) onDone();
  }
}

export function stopSpeaking() {
  Speech.stop();
}

/**
 * Trigger urgent call haptic vibration patterns
 */
export async function triggerUrgentRingtone() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (err) {
    // Ignored on non-supported platforms
  }
}
