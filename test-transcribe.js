// Test script for audio transcription API
const fs = require('fs');

async function testTranscription() {
  console.log('Testing transcription API...');
  
  // Create a simple test audio blob (silence for testing)
  // In a real scenario, this would be actual audio data
  const sampleRate = 16000;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  
  // Create a WAV file header
  const wavHeader = Buffer.alloc(44);
  
  // RIFF chunk descriptor
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + numSamples * 2, 4); // file size - 8
  wavHeader.write('WAVE', 8);
  
  // fmt sub-chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // subchunk1 size
  wavHeader.writeUInt16LE(1, 20); // audio format (PCM)
  wavHeader.writeUInt16LE(1, 22); // num channels
  wavHeader.writeUInt32LE(sampleRate, 24); // sample rate
  wavHeader.writeUInt32LE(sampleRate * 2, 28); // byte rate
  wavHeader.writeUInt16LE(2, 32); // block align
  wavHeader.writeUInt16LE(16, 34); // bits per sample
  
  // data sub-chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(numSamples * 2, 40); // subchunk2 size
  
  // Create audio data (simple tone for testing)
  const audioData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    // Generate a simple sine wave tone
    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 32767 * 0.1;
    audioData.writeInt16LE(Math.floor(sample), i * 2);
  }
  
  // Combine header and data
  const wavFile = Buffer.concat([wavHeader, audioData]);
  
  // Create FormData
  const FormData = require('form-data');
  const formData = new FormData();
  
  // Add the WAV file as a blob
  formData.append('audio', wavFile, {
    filename: 'test.wav',
    contentType: 'audio/wav'
  });
  
  try {
    // Send to our API
    const response = await fetch('http://localhost:5000/api/transcribe', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Transcription successful!');
      console.log('Transcribed text:', result.text);
    } else {
      console.error('❌ Transcription failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing transcription:', error);
  }
}

// Run the test
testTranscription();