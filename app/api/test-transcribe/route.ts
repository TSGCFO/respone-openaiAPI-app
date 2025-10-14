import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  // Test that the OpenAI API key is configured and can make basic requests
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    // Test with a simple audio file to verify the API is working
    // We'll create a simple test to check if OpenAI API is accessible
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ 
        error: 'OpenAI API error',
        details: error,
        status: response.status 
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true,
      message: 'OpenAI API is accessible',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test OpenAI API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Test transcribe - Received audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Audio buffer size:', buffer.length);

    // Create a new FormData with the file
    const openAIFormData = new FormData();
    
    // Create a new blob with explicit type
    const blob = new Blob([buffer], { type: 'audio/webm' });
    const newFile = new File([blob], 'audio.webm', { type: 'audio/webm' });
    
    openAIFormData.append('file', newFile);
    openAIFormData.append('model', 'whisper-1');

    console.log('Sending to OpenAI Whisper API...');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openAIFormData,
    });

    const responseText = await response.text();
    console.log('OpenAI Response status:', response.status);
    console.log('OpenAI Response:', responseText);

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'OpenAI API error',
        status: response.status,
        details: responseText
      }, { status: response.status });
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json({ text: data.text });
    } catch {
      return NextResponse.json({ text: responseText });
    }

  } catch (error) {
    console.error('Test transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}