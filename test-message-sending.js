// Test script to verify message sending fix
const fetch = require('node-fetch');

async function testMessageSending() {
  console.log('Testing message sending to API...');
  
  const testMessages = [
    {
      role: 'user',
      content: [{ type: 'input_text', text: 'Hello, this is a test message' }]
    }
  ];
  
  try {
    const response = await fetch('http://localhost:5000/api/turn_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: testMessages,
        tools: [],
        googleIntegrationEnabled: false,
        model: 'gpt-4.1',
        reasoningEffort: 'medium'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Message sent successfully! Fix is working.');
      
      // Read a bit of the stream to confirm it's working
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const { value, done } = await reader.read();
      
      if (!done) {
        const chunk = decoder.decode(value);
        console.log('First chunk of response:', chunk.substring(0, 200));
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Failed to send message:', error);
  }
}

// Run the test
testMessageSending();