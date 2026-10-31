# ElevenLabs Voice AI Test Module

This module provides a standalone text-to-speech integration with ElevenLabs and automatic audio playback via `pygame.mixer`.

## Features

- **Model**: `eleven_v4`
- **Voice**: Configured for `90ipbRoKi4CpHXvKVtl0` (Anika - Customer Care Agent)
- **Fine-tuned VoiceSettings**:
  - `stability=0.50` (50%)
  - `similarity_boost=0.75` (75%)
  - `style=0.25`
  - `use_speaker_boost=True`
  - `clone_strength=0.0`
- **Natural Speech Markers**: Supports em-dashes (`—`), ellipses (`...`), and audio action tags (`[sighs]`).
- **Graceful Fallback**: Automatically falls back to free-tier compatible voice (`EXAVITQu4vr4xnSDxMaL` / Bella) if the API returns `402 Payment Required` (library voices via API require a paid subscription).

## Quick Start

1. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: On Python 3.14+, `pip install pygame-ce` is used for binary wheel support).*

3. Configure your API key in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env and enter your actual ELEVENLABS_API_KEY
   ```

4. Run the voice generation script:
   ```bash
   python test_voice.py
   ```
