exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'PONG!',
      timestamp: new Date().toISOString(),
      function: 'ping'
    })
  };
};
