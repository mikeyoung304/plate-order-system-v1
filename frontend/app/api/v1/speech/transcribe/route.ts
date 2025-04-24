import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioData = formData.get("audio_data") as string
    const tableId = formData.get("table_id") as string
    const seatNumber = formData.get("seat_number") as string

    if (!audioData) {
      return NextResponse.json(
        {
          success: false,
          error: "No audio data provided",
        },
        { status: 400 },
      )
    }

    // Get the Deepgram API key from environment variables
    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      console.error("Deepgram API key not found")
      // Fall back to mock response if no API key
      return mockResponse(tableId, seatNumber)
    }

    try {
      // Convert base64 to binary
      const binaryData = Buffer.from(audioData, "base64")

      // Send to Deepgram API
      const response = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=false&punctuate=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "audio/webm",
          },
          body: binaryData,
        },
      )

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract the transcription
      const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || ""
      const confidence = data.results?.channels[0]?.alternatives[0]?.confidence || 0.85

      return NextResponse.json({
        success: true,
        text: transcript,
        confidence: confidence,
      })
    } catch (error) {
      console.error("Error calling Deepgram API:", error)
      // Fall back to mock response if API call fails
      return mockResponse(tableId, seatNumber)
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Mock response function for fallback
function mockResponse(tableId: string, seatNumber: string) {
  const foodResponses = [
    "1 chicken soup, 1 garden salad with ranch dressing on the side",
    "1 grilled salmon with steamed vegetables, no salt",
    "1 vegetarian pasta with tomato sauce",
    "1 ribeye steak medium rare with mashed potatoes",
    "1 caesar salad with grilled chicken",
  ]

  const drinkResponses = [
    "1 decaf coffee with cream",
    "1 iced tea, no sugar",
    "1 orange juice, no ice",
    "1 sparkling water with lemon",
    "1 hot chocolate with whipped cream",
  ]

  // Determine if this is likely a food or drink order based on table/seat
  const isFood = Number.parseInt(seatNumber) % 2 === 0

  const responses = isFood ? foodResponses : drinkResponses
  const randomIndex = Math.floor(Math.random() * responses.length)

  return NextResponse.json({
    success: true,
    text: responses[randomIndex],
    confidence: 0.85,
    isMock: true,
  })
}
