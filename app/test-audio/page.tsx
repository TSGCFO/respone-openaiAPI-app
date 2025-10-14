"use client";

import React, { useState } from 'react';
import { AudioRecorder } from '@/components/audio-recorder';

export default function TestAudioPage() {
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAudioReady = (audioBlob: Blob, url: string) => {
    console.log('Audio ready:', audioBlob.size, 'bytes');
    setAudioUrl(url);
  };

  const handleTranscriptionRequest = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Starting transcription for blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Check if blob is empty
      if (audioBlob.size === 0) {
        throw new Error('Recording is empty. Please try recording again.');
      }
      
      const formData = new FormData();
      // Ensure we're creating a proper File object with the right extension
      const fileName = audioBlob.type?.includes('webm') ? "recording.webm" : "recording.wav";
      const audioFile = new File([audioBlob], fileName, {
        type: audioBlob.type || "audio/webm"
      });
      
      console.log('Sending audio file:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      formData.append("audio", audioFile);
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        console.error("Transcription API error:", data);
        // Show more detailed error information
        const errorMsg = data.details ? 
          `${data.error}: ${JSON.stringify(data.details)}` : 
          (data.error || "Transcription failed");
        throw new Error(errorMsg);
      }
      
      if (data.text) {
        setTranscribedText(data.text);
        console.log('Transcription successful:', data.text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Audio Transcription Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Record Audio</h2>
            <p className="text-gray-600">Click the microphone button to start recording, then click it again to stop and transcribe.</p>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <AudioRecorder
              onAudioReady={handleAudioReady}
              onTranscriptionRequest={handleTranscriptionRequest}
              maxRecordingTime={60}
            />
          </div>
          
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Transcribing audio...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {audioUrl && (
            <div className="space-y-2">
              <h3 className="font-semibold">Recorded Audio:</h3>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
          
          {transcribedText && (
            <div className="space-y-2">
              <h3 className="font-semibold">Transcribed Text:</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-gray-800">{transcribedText}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Click the microphone button to start recording</li>
            <li>Speak clearly for a few seconds</li>
            <li>Click the button again to stop recording</li>
            <li>Wait for the transcription to complete</li>
            <li>The transcribed text should appear below</li>
          </ol>
        </div>
      </div>
    </div>
  );
}