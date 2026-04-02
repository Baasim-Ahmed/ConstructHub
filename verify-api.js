// Quick verification that all API endpoints return data for admin users
async function testAdminDataAccess() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('🧪 Testing API endpoints for ADMIN user...\n');
  
  const endpoints = [
    '/projects',
    '/clients', 
    '/tasks',
    '/users',
    '/documents',
    '/activity',
    '/dashboard/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`);
      const data = await res.json();
      
      if (res.ok) {
        const count = Array.isArray(data) ? data.length : (data.totalProjects !== undefined ? 'stats' : 'unknown');
        console.log(`✅ ${endpoint.padEnd(25)} - Status: ${res.status}, Count: ${count}`);
      } else {
        console.log(`❌ ${endpoint.padEnd(25)} - Status: ${res.status}, Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.padEnd(25)} - Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ API verification complete!');
}

testAdminDataAccess().catch(console.error);
