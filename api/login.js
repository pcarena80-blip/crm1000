const users = [
  { id: 1, name: "John Doe", email: "john@example.com", password: "password123" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", password: "password456" }
];

export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      receivedMethod: req.method,
      allowedMethod: 'POST'
    });
  }

  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find user by email and password
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login successful for user:', userWithoutPassword);
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    } else {
      console.log('Login failed for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login function error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid request body'
    });
  }
}
