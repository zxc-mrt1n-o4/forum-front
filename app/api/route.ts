export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'frontend',
    timestamp: Date.now()
  })
} 