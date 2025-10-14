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

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      console.error('File size exceeds limit:', audioFile.size);
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

    // Convert the File to a Buffer first
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Audio buffer size:', buffer.length);

    // Create a new FormData for OpenAI API
    // Important: Create a proper File object with the correct MIME type
    const openAIFormData = new FormData();
    
    // Create a Blob with the correct MIME type for webm
    const blob = new Blob([buffer], { type: 'audio/webm' });
    
    // Create a File from the Blob with a proper filename
    // OpenAI expects the file to have a proper extension
    const fileName = audioFile.name || 'recording.webm';
    const processedFile = new File([blob], fileName, { type: 'audio/webm' });
    
    openAIFormData.append('file', processedFile);
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
    
    if (!response.ok) {
      console.error('OpenAI Whisper API error:', responseText);
      
      // Try to parse error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }
      
      return NextResponse.json(
        { 
          error: 'Transcription failed',
          details: errorDetails,
          status: response.status
        },
        { status: response.status }
      );
    }

    // Parse the successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If it's not JSON, assume it's the text directly
      data = { text: responseText };
    }
    
    console.log('Transcription successful:', data.text?.substring(0, 100));
    
    return NextResponse.json({ text: data.text });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}