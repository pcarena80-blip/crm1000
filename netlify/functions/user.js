const users = [
  { id: 1, name: "John Doe", email: "john@example.com", password: "password123" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", password: "password456" }
];

exports.handler = async (event, context) => {
  console.log('User function called with:', event);
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract email from path parameters
    // The path will be like /api/user/john@example.com
    const pathParts = event.path.split('/');
    const email = pathParts[pathParts.length - 1];
    
    console.log('Looking for user with email:', email);

    // Find user by email
    const user = users.find(u => u.email === email);

    if (user) {
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      console.log('User found:', userWithoutPassword);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(userWithoutPassword)
      };
    } else {
      console.log('User not found for email:', email);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          error: 'User not found'
        })
      };
    }
  } catch (error) {
    console.error('User function error:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Invalid request'
      })
    };
  }
};
