// Netlify serverless function for user login
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
    const { email, password } = JSON.parse(event.body || '{}');
    
    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }
    
    // In a real application, you would validate against a database
    // For this example, we'll just return a success response
    // In production, you would:
    // 1. Check if the user exists in your database
    // 2. Verify the password (using proper hashing)
    // 3. Generate a JWT token or session
    
    // Mock successful login for demonstration
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Login successful!',
        user: {
          id: '1', // This would be the actual user ID from your database
          name: 'User', // This would be the actual user name
          email: email
        }
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during login' }),
    };
  }
}