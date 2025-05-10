// File: frontend/app/api/v1/speech/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mockAPI } from '@/mocks/mockData';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
        }

        console.log(`[API Route] Received audio file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Use mock transcription instead of OpenAI
        const transcription = await mockAPI.transcribeAudio(file);

        console.log("[API Route] Mock Transcription Response:", transcription);

        // Return the transcription text
        return NextResponse.json({ text: transcription.text });

    } catch (error: any) {
        console.error("[API Route] Error during transcription:", error);

        let errorMessage = "Failed to transcribe audio.";
        let statusCode = 500;

        if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
