'use client'

export default function HealthCheck() {
  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1f2937', 
      color: '#ffffff',
      minHeight: '100vh',
      margin: 0
    }}>
      <h1>🟢 Frontend Health Check</h1>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Status:</strong> <span style={{ color: '#10b981' }}>HEALTHY</span></p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        <p><strong>Environment:</strong> production</p>
        <p><strong>Server:</strong> Next.js Standalone</p>
        <p><strong>Platform:</strong> Railway</p>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#374151', borderRadius: '8px' }}>
        <h3>✅ System Status</h3>
        <ul>
          <li>✅ Next.js Application: Running</li>
          <li>✅ Health Endpoint: Accessible</li>
          <li>✅ Docker Container: Active</li>
          <li>✅ Railway Platform: Connected</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
        <p>This endpoint is used by Railway for health checks.</p>
        <p>If you see this page, the frontend is running correctly.</p>
        <p>Response: 200 OK</p>
      </div>
    </div>
  )
} 