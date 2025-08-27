// Netlify serverless function for user registration
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
    const { name, email, password } = JSON.parse(event.body || '{}');
    
    // Validation
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'All fields are required' }),
      };
    }
    
    if (password.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 6 characters long' }),
      };
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please enter a valid email address' }),
      };
    }
    
    // In a real application, you would check if the email exists in a database
    // and store the new user in a database
    // For this example, we'll just return a success response
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user: {
          name,
          email,
          // Don't return the password in the response
        }
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}