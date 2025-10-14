"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, MessageSquare } from "lucide-react";

export default function TestSwipeGestures() {
  const [testResults, setTestResults] = useState<{
    conversationSwipe: string;
    messageDelete: string;
    pullToRefresh: string;
  }>({
    conversationSwipe: "Not tested",
    messageDelete: "Not tested",
    pullToRefresh: "Not tested",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Swipe Gesture Test Suite</h1>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Swipe Gesture Features
          </h2>
          
          <div className="space-y-6">
            {/* Swipe Between Conversations */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-lg mb-2">1. Swipe Between Conversations</h3>
              <p className="text-gray-600 mb-3">
                Navigate between conversations by swiping horizontally on the chat area.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm font-mono">
                  <ChevronLeft className="inline h-4 w-4" /> Swipe Right: Go to previous conversation
                </p>
                <p className="text-sm font-mono">
                  <ChevronRight className="inline h-4 w-4" /> Swipe Left: Go to next conversation
                </p>
              </div>
              <div className="mt-3">
                <span className="text-sm font-medium">Status: </span>
                <span className={`text-sm ${testResults.conversationSwipe === "Working" ? "text-green-600" : "text-gray-500"}`}>
                  {testResults.conversationSwipe}
                </span>
              </div>
            </div>

            {/* Swipe to Delete Messages */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-medium text-lg mb-2">2. Swipe to Delete Messages</h3>
              <p className="text-gray-600 mb-3">
                Delete messages by swiping left on individual message bubbles.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm font-mono">
                  <Trash2 className="inline h-4 w-4" /> Swipe Left: Delete message
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  • iOS: Reveals delete button
                  <br />
                  • Android: Auto-deletes with animation
                </p>
              </div>
              <div className="mt-3">
                <span className="text-sm font-medium">Status: </span>
                <span className={`text-sm ${testResults.messageDelete === "Working" ? "text-green-600" : "text-gray-500"}`}>
                  {testResults.messageDelete}
                </span>
              </div>
            </div>

            {/* Pull to Refresh */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-lg mb-2">3. Pull to Refresh</h3>
              <p className="text-gray-600 mb-3">
                Load older messages by pulling down from the top of the message list.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm font-mono">
                  <RefreshCw className="inline h-4 w-4" /> Pull Down: Load more messages
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  • Shows visual feedback during pull
                  <br />
                  • Haptic feedback on mobile devices
                  <br />
                  • Spring physics animation
                </p>
              </div>
              <div className="mt-3">
                <span className="text-sm font-medium">Status: </span>
                <span className={`text-sm ${testResults.pullToRefresh === "Working" ? "text-green-600" : "text-gray-500"}`}>
                  {testResults.pullToRefresh}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-lg font-semibold mb-3 text-green-800">Implementation Details</h2>
          <ul className="space-y-2 text-sm text-green-700">
            <li>✓ SSR-safe implementation with window checks</li>
            <li>✓ Platform-specific animations (iOS/Android)</li>
            <li>✓ Haptic feedback integration</li>
            <li>✓ Gesture conflict prevention</li>
            <li>✓ Spring physics animations</li>
            <li>✓ Edge swipe detection</li>
            <li>✓ Velocity-based gesture recognition</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3">Manual Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Test Conversation Swipe:</strong>
              <ul className="mt-1 ml-6 list-disc text-gray-600">
                <li>Create multiple conversations first</li>
                <li>Swipe left/right on the chat area</li>
                <li>Verify smooth transitions between conversations</li>
              </ul>
            </li>
            <li>
              <strong>Test Message Delete:</strong>
              <ul className="mt-1 ml-6 list-disc text-gray-600">
                <li>Send a few messages</li>
                <li>Swipe left on any message</li>
                <li>Verify delete animation and removal</li>
              </ul>
            </li>
            <li>
              <strong>Test Pull to Refresh:</strong>
              <ul className="mt-1 ml-6 list-disc text-gray-600">
                <li>Open a conversation with messages</li>
                <li>Pull down from the top of the message list</li>
                <li>Verify loading indicator and haptic feedback</li>
              </ul>
            </li>
          </ol>
          
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => setTestResults({
                conversationSwipe: "Working",
                messageDelete: "Working",
                pullToRefresh: "Working",
              })}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark All as Working
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              Go to Chat
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}