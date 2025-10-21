// Test script to verify API endpoints are working

async function testAPIs() {
  const baseURL = 'http://localhost:5000';
  const userId = 'test_user';
  
  console.log('Testing Semantic Memories API...\n');
  
  // Test GET semantic memories
  try {
    const getRes = await fetch(`${baseURL}/api/semantic-memories`, {
      headers: { 'x-user-id': userId }
    });
    const data = await getRes.json();
    console.log('✓ GET /api/semantic-memories:', getRes.status, data.memories ? `${data.memories.length} memories found` : 'No memories');
  } catch (error) {
    console.error('✗ GET /api/semantic-memories failed:', error.message);
  }
  
  // Test POST semantic memory
  try {
    const postRes = await fetch(`${baseURL}/api/semantic-memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        conversationId: 1,
        content: 'Test memory content',
        summary: 'Test memory summary',
        importance: 7,
        generateEmbedding: false
      })
    });
    const data = await postRes.json();
    console.log('✓ POST /api/semantic-memories:', postRes.status, data.memory ? 'Memory created' : 'Failed');
    
    // Test DELETE if created successfully
    if (data.memory && data.memory.id) {
      const deleteRes = await fetch(`${baseURL}/api/semantic-memories?id=${data.memory.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      const deleteData = await deleteRes.json();
      console.log('✓ DELETE /api/semantic-memories:', deleteRes.status, deleteData.success ? 'Memory deleted' : 'Failed');
    }
  } catch (error) {
    console.error('✗ POST /api/semantic-memories failed:', error.message);
  }
  
  // Test semantic search
  try {
    const searchRes = await fetch(`${baseURL}/api/semantic-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        query: 'test',
        limit: 10
      })
    });
    const data = await searchRes.json();
    console.log('✓ POST /api/semantic-search:', searchRes.status, data.results ? `${data.results.length} results found` : 'No results');
  } catch (error) {
    console.error('✗ POST /api/semantic-search failed:', error.message);
  }
  
  console.log('\nAPI tests completed!');
}

testAPIs().catch(console.error);