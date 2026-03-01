import { NextResponse } from "next/server";
const ElevenLabs = require("elevenlabs-node");

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text, voiceId = "pNInz6obpg8n9Y99P0AY" } = await req.json(); // Default voice

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API Key not configured" },
        { status: 500 },
      );
    }

    const voice = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: voiceId,
    });

    const audioStream = await voice.textToSpeechStream({
      textInput: text,
      modelId: "eleven_multilingual_v2",
      stability: 0.5,
      similarityBoost: 0.5,
    });

    // Convert stream to readable buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("ElevenLabs Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
