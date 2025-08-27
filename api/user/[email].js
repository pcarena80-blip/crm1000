const users = [
  { id: 1, name: "John Doe", email: "john@example.com", password: "password123" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", password: "password456" }
];

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      receivedMethod: req.method,
      allowedMethod: 'GET'
    });
  }

  try {
    const { email } = req.query;
    console.log('Looking for user with email:', email);

    // Find user by email
    const user = users.find(u => u.email === email);

    if (user) {
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      console.log('User found:', userWithoutPassword);
      
      return res.status(200).json(userWithoutPassword);
    } else {
      console.log('User not found for email:', email);
      return res.status(404).json({
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('User function error:', error);
    return res.status(400).json({
      error: 'Invalid request'
    });
  }
}
