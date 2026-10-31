// Voice Service: ElevenLabs AI Voice (TTS) & Browser Speech-to-Text (STT)
//
// TTS uses a Next.js server-side proxy at /api/tts which calls the ElevenLabs API.
// The API key never leaves the server. The client receives an audio/mpeg stream
// and plays it through the Web Audio API / HTMLAudioElement.
//
// STT continues to use the browser Web Speech API (no API key needed).

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let activeRecognition: any = null;
let isAudioMuted = false;
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

// Initialize mute state from localStorage if available
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("pact_voice_muted");
    if (saved !== null) {
      isAudioMuted = saved === "true";
    }
  } catch {}
}

export function isVoiceMuted(): boolean {
  return isAudioMuted;
}

export function setVoiceMuted(muted: boolean): void {
  isAudioMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("pact_voice_muted", String(muted));
      if (muted) {
        stopSpeaking();
      }
    } catch {}
  }
}

/**
 * Clean text for natural speech synthesis (remove markdown, symbols, links, hashes)
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown headers #, ##, etc.
    .replace(/^#+\s+/gm, "")
    // Remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove bullet points
    .replace(/^[-*•]\s+/gm, "")
    // Remove excessive hashes or ids
    .replace(/#\w+/g, "")
    // Replace multiple spaces or newlines
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Text-to-Speech (TTS): Speaks text aloud using ElevenLabs AI voice
 * via the server-side /api/tts proxy.
 *
 * Falls back to browser SpeechSynthesis if the API call fails.
 */
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined") return;
  if (isAudioMuted) return;

  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  // Stop any currently playing audio first
  stopSpeaking();

  // Call the ElevenLabs TTS proxy
  speakWithElevenLabs(clean, onStart, onEnd);
}

/**
 * Call the server-side ElevenLabs proxy and play the returned audio.
 */
async function speakWithElevenLabs(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.warn(`[Voice] ElevenLabs TTS returned ${response.status}, falling back to browser TTS.`);
      speakWithBrowserTTS(text, onStart, onEnd);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Clean up any previous object URL
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudio = null;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      console.warn("[Voice] Audio playback error, falling back to browser TTS.");
      currentAudio = null;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
      speakWithBrowserTTS(text, onStart, onEnd);
    };

    await audio.play();
  } catch (err) {
    console.warn("[Voice] ElevenLabs TTS failed, falling back to browser TTS:", err);
    speakWithBrowserTTS(text, onStart, onEnd);
  }
}

/**
 * Fallback: Browser SpeechSynthesis (used only if ElevenLabs API is unreachable)
 */
function speakWithBrowserTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    utterance.lang = "en-IN";

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      console.warn("[Voice] Browser SpeechSynthesis error");
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[Voice] Browser SpeechSynthesis failed:", err);
    if (onEnd) onEnd();
  }
}

/**
 * Stop any current speech playback (ElevenLabs audio or browser synthesis)
 */
export function stopSpeaking(): void {
  // Stop ElevenLabs audio playback
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
    } catch {}
    currentAudio = null;
  }
  if (currentObjectUrl) {
    try {
      URL.revokeObjectURL(currentObjectUrl);
    } catch {}
    currentObjectUrl = null;
  }

  // Also cancel any browser speech synthesis
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Speech-to-Text (STT): Starts recording user speech via Web Speech API
 */
export function startListening(handlers: VoiceRecognitionHandlers): boolean {
  if (typeof window === "undefined") return false;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (handlers.onError) {
      handlers.onError("Speech recognition is not supported in this browser.");
    }
    return false;
  }

  // Stop any active recognition session
  stopListening();

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (handlers.onStart) handlers.onStart();
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      const text = finalTranscript || interim;
      if (text) {
        handlers.onResult(text, Boolean(finalTranscript));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (handlers.onError) {
        handlers.onError(event.error || "Speech recognition error");
      }
    };

    recognition.onend = () => {
      activeRecognition = null;
      if (handlers.onEnd) handlers.onEnd();
    };

    activeRecognition = recognition;
    recognition.start();
    return true;
  } catch (err: any) {
    console.warn("Failed to start speech recognition:", err);
    if (handlers.onError) {
      handlers.onError(err.message || "Failed to start microphone");
    }
    return false;
  }
}

/**
 * Stop active speech recognition
 */
export function stopListening(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {}
    activeRecognition = null;
  }
}
