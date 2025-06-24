export default function HealthCheck() {
  const timestamp = new Date().toISOString();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1f2937', 
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1>🟢 Frontend Health Check</h1>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Status:</strong> <span style={{ color: '#10b981' }}>HEALTHY</span></p>
        <p><strong>Timestamp:</strong> {timestamp}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
        <p><strong>Backend URL:</strong> {backendUrl}</p>
        <p><strong>Build Time:</strong> {process.env.BUILD_TIME || 'Unknown'}</p>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#374151', borderRadius: '8px' }}>
        <h3>✅ System Status</h3>
        <ul>
          <li>✅ Next.js Application: Running</li>
          <li>✅ Server-Side Rendering: Enabled</li>
          <li>✅ Environment Variables: Loaded</li>
          <li>✅ Health Endpoint: Accessible</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
        <p>This endpoint is used by Railway for health checks.</p>
        <p>If you see this page, the frontend is running correctly.</p>
      </div>
    </div>
  )
} 