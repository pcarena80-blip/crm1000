export async function handler(event, context) {
  const { username, password } = JSON.parse(event.body);

  if (username && password) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Signup successful" }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ success: false, message: "Invalid data" }),
  };
}
