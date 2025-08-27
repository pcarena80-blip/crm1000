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
    const { email } = req.body;
    console.log('Logout request for email:', email);

    // In a real app, you might invalidate tokens here
    // For now, just return success
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout function error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid request body'
    });
  }
}
