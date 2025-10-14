import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('No audio file provided in formData');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Validate file type - accept webm with codecs
    const validTypes = [
      'audio/webm', 
      'audio/webm;codecs=opus',
      'audio/ogg', 
      'audio/mpeg', 
      'audio/mp4', 
      'audio/wav'
    ];
    
    // Check if the file type starts with any valid type (to handle codec variations)
    const isValidType = validTypes.some(type => 
      audioFile.type.startsWith(type.split(';')[0])
    );
    
    if (!isValidType) {
      console.error('Invalid audio file type:', audioFile.type);
      return NextResponse.json(
        { error: `Invalid audio file type: ${audioFile.type}` },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured. Please set OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    // Implement OpenAI Whisper transcription
    const formDataForAPI = new FormData();
    formDataForAPI.append('file', audioFile);
    formDataForAPI.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formDataForAPI,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Whisper API error:', errorData);
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}