// File: frontend/app/api/v1/speech/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ensure the API key is loaded securely from environment variables on the server
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const OPENAI_MODEL = "whisper-1";

export async function POST(request: NextRequest) {
    if (!openai) {
        console.error("OpenAI API key not configured on the server.");
        return NextResponse.json({ error: "Server configuration error: Missing API Key." }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
        }

        console.log(`[API Route] Received audio file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Ensure the file is treated correctly by the OpenAI SDK
        // The SDK expects a File object or similar structure
        const transcription = await openai.audio.transcriptions.create({
            file: file, // Pass the File object directly
            model: OPENAI_MODEL,
            // language: 'en', // Optional: Specify language
            // response_format: "json", // Default is json
        });

        console.log("[API Route] OpenAI Transcription Response:", transcription);

        // Return the transcription text
        return NextResponse.json({ text: transcription.text });

    } catch (error: any) {
        console.error("[API Route] Error during transcription:", error);

        let errorMessage = "Failed to transcribe audio.";
        let statusCode = 500;

        if (error.response) {
            // Handle potential errors from OpenAI API
            console.error("[API Route] OpenAI API Error Status:", error.response.status);
            console.error("[API Route] OpenAI API Error Body:", error.response.data);
            errorMessage = error.response.data?.error?.message || errorMessage;
            statusCode = error.response.status;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
