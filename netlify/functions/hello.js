exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Hello from Netlify Function!',
      timestamp: new Date().toISOString(),
      path: event.path,
      method: event.httpMethod
    })
  };
};
