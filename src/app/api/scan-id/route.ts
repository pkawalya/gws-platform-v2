import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Use z-ai-web-dev-sdk to analyze the ID image
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an OCR assistant specialized in reading Ugandan National Identity Cards. Extract the following fields and return them as JSON: first_name, last_name, date_of_birth, nin (National Identification Number), district, gender. Return ONLY valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all information from this Ugandan National ID card image. Return the data as JSON with keys: first_name, last_name, date_of_birth, nin, district, gender.' },
            { type: 'image_url', image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` } }
          ]
        }
      ]
    })

    // Parse the response - try to extract JSON from the completion
    const responseText = completion.choices?.[0]?.message?.content || ''
    
    // Try to parse JSON from the response
    let parsed: Record<string, string> = {}
    try {
      // First try direct parse
      parsed = JSON.parse(responseText)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim())
        } catch {
          // Try to find JSON object in the text
          const objMatch = responseText.match(/\{[\s\S]*\}/)
          if (objMatch) {
            parsed = JSON.parse(objMatch[0])
          }
        }
      } else {
        // Try to find JSON object in the text
        const objMatch = responseText.match(/\{[\s\S]*\}/)
        if (objMatch) {
          parsed = JSON.parse(objMatch[0])
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        first_name: parsed.first_name || parsed.firstName || '',
        last_name: parsed.last_name || parsed.lastName || '',
        date_of_birth: parsed.date_of_birth || parsed.dateOfBirth || parsed.dob || '',
        nin: parsed.nin || parsed.nationalId || parsed.national_id || '',
        district: parsed.district || '',
        gender: parsed.gender || '',
      }
    })
  } catch (error: any) {
    console.error('Scan ID error:', error)
    return NextResponse.json({ 
      error: 'Failed to scan ID', 
      details: error.message 
    }, { status: 500 })
  }
}
