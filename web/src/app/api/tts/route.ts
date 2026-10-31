import { NextResponse } from "next/server";

/**
 * POST /api/tts
 * Server-side proxy to ElevenLabs Text-to-Speech API.
 * Keeps the API key on the server — client sends text, receives audio/mpeg stream.
 *
 * Body: { text: string }
 * Response: audio/mpeg binary stream
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "90ipbRoKi4CpHXvKVtl0";
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v4";

// Free-tier fallback voice (Bella) in case the primary voice requires a paid plan
const FREE_TIER_FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

async function callElevenLabs(voiceId: string, text: string): Promise<Response> {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.50,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  );
}

export async function POST(request: Request) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required for speech synthesis." },
        { status: 400 }
      );
    }

    // Truncate very long texts to avoid excessive API usage (ElevenLabs max ~5000 chars)
    const cleanText = text.slice(0, 4500);

    // Try primary voice first
    let response = await callElevenLabs(ELEVENLABS_VOICE_ID, cleanText);

    // Fallback to free-tier voice if payment required (402)
    if (response.status === 402) {
      console.warn(
        `[TTS] Voice '${ELEVENLABS_VOICE_ID}' requires paid plan. Falling back to '${FREE_TIER_FALLBACK_VOICE_ID}'.`
      );
      response = await callElevenLabs(FREE_TIER_FALLBACK_VOICE_ID, cleanText);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(`[TTS] ElevenLabs API error ${response.status}:`, errorBody);
      return NextResponse.json(
        { error: `ElevenLabs API returned ${response.status}` },
        { status: response.status }
      );
    }

    // Stream the audio bytes back to the client
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[TTS] Route error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech", details: error.message },
      { status: 500 }
    );
  }
}
