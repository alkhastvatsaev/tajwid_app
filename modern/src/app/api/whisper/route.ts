import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Readable } from "stream";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key not configured" },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 },
      );
    }

    // Convert Blob/File to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Whisper transcription with specialized Prompt for Tajwid context & Noise filtering
    const response = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, "speech.webm", { type: "audio/webm" }),
      model: "whisper-1",
      language: "ar",
      prompt:
        "Qur'an recitation, Tajwid, Bismillah al-Rahman al-Rahim, Al-Fatiha, Uthmani script. Focus on exact pronunciation of Arabic letters.",
    });

    return NextResponse.json({ transcript: response.text });
  } catch (error: any) {
    console.error("Whisper API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
