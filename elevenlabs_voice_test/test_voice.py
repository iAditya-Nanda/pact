import os
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from elevenlabs.core.api_error import ApiError
import pygame

# Default fallback voice that works on ElevenLabs Free Tier without paid plan requirement
FREE_TIER_FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Bella


def generate_speech(client, voice_id: str, model_id: str, text: str, voice_settings: VoiceSettings):
    """Attempt speech conversion with given voice; falls back to free voice if 402 occurs."""
    print(f"Generating audio using model '{model_id}' and voice '{voice_id}'...")
    try:
        audio_stream = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=model_id,
            voice_settings=voice_settings,
        )
        chunks = [chunk for chunk in audio_stream]
        return chunks, voice_id
    except ApiError as e:
        # Check if the error is due to community voice requiring a paid subscription
        if e.status_code == 402 or (e.body and "paid_plan_required" in str(e.body)):
            print("\n" + "=" * 60)
            print(f"[!] Warning: Voice '{voice_id}' is a community library voice.")
            print("    ElevenLabs requires a paid subscription to use library voices via API.")
            print(f"    Falling back to premade voice '{FREE_TIER_FALLBACK_VOICE_ID}' (Bella)...")
            print("=" * 60 + "\n")
            audio_stream = client.text_to_speech.convert(
                voice_id=FREE_TIER_FALLBACK_VOICE_ID,
                text=text,
                model_id=model_id,
                voice_settings=voice_settings,
            )
            chunks = [chunk for chunk in audio_stream]
            return chunks, FREE_TIER_FALLBACK_VOICE_ID
        raise e


def main():
    # Load environment variables from .env
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        raise ValueError(
            "ELEVENLABS_API_KEY is not set or contains the default placeholder. "
            "Please add your actual ElevenLabs API key in .env"
        )

    # Initialize ElevenLabs client
    client = ElevenLabs(api_key=api_key)

    # Configure fine-tuned voice settings (stability 50%, similarity 75%, clone strength 0)
    voice_settings = VoiceSettings(
        stability=0.50,
        similarity_boost=0.75,
        style=0.25,
        use_speaker_boost=True,
        clone_strength=0.0,
    )

    # Test sentence containing pause markers (em-dash, ellipsis) and audio tag [sighs]
    text = (
        "[sighs] Well... I suppose it's time to admit the truth — we were wrong "
        "all along, weren't we? ... Still, there's always tomorrow."
    )

    # Requested voice ID from https://elevenlabs.io/voices/90ipbRoKi4CpHXvKVtl0
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "90ipbRoKi4CpHXvKVtl0")
    model_id = "eleven_v4"
    output_filename = Path(__file__).resolve().parent / "voice_test.mp3"

    chunks, used_voice = generate_speech(client, voice_id, model_id, text, voice_settings)

    # Save audio stream to MP3 file
    with open(output_filename, "wb") as f:
        for chunk in chunks:
            f.write(chunk)

    print(f"Audio successfully saved to {output_filename} (Voice: {used_voice})")

    # Play audio automatically using pygame.mixer
    print("Playing audio with pygame.mixer...")
    pygame.mixer.init()
    try:
        pygame.mixer.music.load(str(output_filename))
        pygame.mixer.music.play()

        clock = pygame.time.Clock()
        while pygame.mixer.music.get_busy():
            clock.tick(10)
    finally:
        pygame.mixer.quit()

    print("Playback completed.")


if __name__ == "__main__":
    main()
