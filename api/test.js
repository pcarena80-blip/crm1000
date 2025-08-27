export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url
  });
}
