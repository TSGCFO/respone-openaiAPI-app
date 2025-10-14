"use client";

import React, { useState } from 'react';
import { AudioRecorder } from '@/components/audio-recorder';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { MicrophoneButton } from '@/components/microphone-button';
import { RecordingTimer } from '@/components/recording-timer';
import { Play, Download, Trash2, Volume2 } from 'lucide-react';

export default function VoiceDemoPage() {
  const [recordings, setRecordings] = useState<Array<{
    id: string;
    blob: Blob;
    url: string;
    timestamp: Date;
    duration: number;
    transcription?: string;
  }>>([]);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    isSupported,
  } = useAudioRecorder();

  const handleAudioReady = (blob: Blob, url: string) => {
    const recording = {
      id: Date.now().toString(),
      blob,
      url,
      timestamp: new Date(),
      duration: recordingTime,
    };
    setRecordings(prev => [recording, ...prev]);
    console.log('Recording saved:', recording);
  };

  const handleTranscriptionRequest = async (blob: Blob) => {
    console.log('Transcription requested for blob:', blob);
    // In a real implementation, you would send this to your transcription API
    // For demo purposes, we'll just show a placeholder
    const lastRecording = recordings[0];
    if (lastRecording) {
      setRecordings(prev => 
        prev.map(r => 
          r.id === lastRecording.id 
            ? { ...r, transcription: 'Transcription would appear here after processing...' }
            : r
        )
      );
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  const downloadRecording = (recording: typeof recordings[0]) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `recording_${recording.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported && typeof window !== 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Audio Recording Not Supported</h1>
          <p className="text-gray-600">
            Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voice Recording Demo</h1>
        
        {/* Recording Controls Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recording Controls</h2>
          
          <div className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
              </span>
              {isRecording && (
                <RecordingTimer seconds={recordingTime} isPaused={isPaused} />
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              <MicrophoneButton
                isRecording={isRecording}
                isPaused={isPaused}
                error={error}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
              />
              
              {isRecording && (
                <button
                  onClick={resetRecording}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Integrated Component Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Integrated Audio Recorder</h2>
          <p className="text-sm text-gray-600 mb-4">
            This shows how the AudioRecorder component integrates all features together:
          </p>
          <AudioRecorder
            onAudioReady={handleAudioReady}
            onTranscriptionRequest={handleTranscriptionRequest}
            maxRecordingTime={60}
          />
        </div>

        {/* Current Recording Preview */}
        {audioUrl && !isRecording && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Recording</h2>
            <audio controls src={audioUrl} className="w-full mb-4" />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (audioBlob) {
                    handleAudioReady(audioBlob, audioUrl);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Save Recording
              </button>
              <button
                onClick={resetRecording}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Recordings List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Recordings</h2>
          
          {recordings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recordings yet. Click the microphone button above to start recording.
            </p>
          ) : (
            <div className="space-y-4">
              {recordings.map(recording => (
                <div key={recording.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        Recording {recording.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatDuration(recording.duration)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadRecording(recording)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRecording(recording.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <audio controls src={recording.url} className="w-full mb-2" />
                  
                  {recording.transcription && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium mb-1">Transcription:</p>
                      <p className="text-sm text-gray-700">{recording.transcription}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Status */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Feature Status</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Web Audio API integration with MediaRecorder
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Visual feedback (pulsing animation, recording timer)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Recording states (idle, recording, paused, processing)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Error handling for permissions and browser compatibility
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Audio blob creation and temporary storage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Integrated into chat interface
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-600">⚡</span>
              Ready for transcription API integration (placeholder implemented)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}