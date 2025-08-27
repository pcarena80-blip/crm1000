const users = [
  { id: 1, name: "John Doe", email: "john@example.com", password: "password123" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", password: "password456" }
];

exports.handler = async (event, context) => {
  console.log('=== LOGIN FUNCTION CALLED ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body:', event.body);
  console.log('=============================');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({ 
        error: 'Method not allowed',
        receivedMethod: event.httpMethod,
        allowedMethod: 'POST'
      })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    console.log('Login attempt for email:', email);

    // Find user by email and password
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login successful for user:', userWithoutPassword);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          success: true,
          user: userWithoutPassword
        })
      };
    } else {
      console.log('Login failed for email:', email);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        })
      };
    }
  } catch (error) {
    console.error('Login function error:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: false,
        error: 'Invalid request body'
      })
    };
  }
};
