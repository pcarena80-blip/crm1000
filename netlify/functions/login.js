// Netlify serverless function for user login
exports.handler = async function (event, context) {
  try {
    // Only allow POST method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Parse request body
    const { email, password } = JSON.parse(event.body || "{}");

    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password are required" }),
      };
    }

    // Mock successful login
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Login successful!",
        user: {
          id: "1",
          name: "User",
          email: email,
        },
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error during login" }),
    };
  }
};
