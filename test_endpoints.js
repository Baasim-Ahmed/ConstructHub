async function testEndpoints() {
  const base = 'http://localhost:3000';
  
  console.log('=== Testing API Endpoints ===\n');

  // Test 1: Check /api/auth/me without auth
  console.log('1. Testing /api/auth/me (no auth)...');
  let res = await fetch(`${base}/api/auth/me`);
  console.log(`   Status: ${res.status}`);
  let data = await res.json();
  console.log(`   Response:`, data);
  console.log();

  // Test 2: Sign in with hardcoded credentials
  console.log('2. Testing sign-in with "admin" / "123456"...');
  res = await fetch(`${base}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: '123456' })
  });
  console.log(`   Status: ${res.status}`);
  data = await res.text();
  console.log(`   Response:`, data.substring(0, 200));
  console.log();

  // Test 3: Sign in with seeded credentials
  console.log('3. Testing sign-in with admin@constructhub.com / password...');
  res = await fetch(`${base}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@constructhub.com', password: 'password' })
  });
  console.log(`   Status: ${res.status}`);
  data = await res.text();
  console.log(`   Response:`, data.substring(0, 200));
  console.log();

  // Test 4: Fetch dashboard/stats without auth
  console.log('4. Testing /api/dashboard/stats (no auth)...');
  res = await fetch(`${base}/api/dashboard/stats`);
  console.log(`   Status: ${res.status}`);
  data = await res.json();
  console.log(`   Response:`, data);
  console.log();

  // Test 5: Fetch projects without auth
  console.log('5. Testing /api/projects (no auth)...');
  res = await fetch(`${base}/api/projects`);
  console.log(`   Status: ${res.status}`);
  data = await res.json();
  console.log(`   Response:`, data);
}

testEndpoints().catch(console.error);
