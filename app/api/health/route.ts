export async function GET() {
  return Response.json({
    ok: true,
    status: 'healthy',
    time: Date.now()
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
} 