// Netlify serverless function for AI chat
export async function handler(event, context) {
  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Parse request body
    const { messages, model = 'gemini' } = JSON.parse(event.body || '{}');
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages array is required' }),
      };
    }

    // In a real implementation, you would integrate with AI services here
    // For this example, we'll return a mock response
    
    // Get the last message content
    const lastMessage = messages[messages.length - 1].content;
    
    // Create a simple mock response
    const mockResponse = `This is a mock response from the ${model} model. You said: "${lastMessage}"`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        response: mockResponse,
        model: model
      }),
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during chat' }),
    };
  }
}