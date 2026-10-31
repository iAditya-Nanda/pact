// Voice Service: Browser Text-to-Speech (TTS) & Speech-to-Text (STT)

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let activeRecognition: any = null;
let isAudioMuted = false;

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
        window.speechSynthesis?.cancel();
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
 * Text-to-Speech (TTS): Speaks text aloud in natural executive voice
 */
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  if (isAudioMuted) {
    return;
  }

  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05; // Slightly crisp executive pace
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick a high-quality English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.name.includes("Samantha") ||
          v.name.includes("Natural") ||
          v.name.includes("Google US English") ||
          v.name.includes("Daniel") ||
          v.name.includes("Aaron")) &&
        v.lang.startsWith("en")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis failed to execute:", err);
    if (onEnd) onEnd();
  }
}

/**
 * Stop any current speech playback
 */
export function stopSpeaking(): void {
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
