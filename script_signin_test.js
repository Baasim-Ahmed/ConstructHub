async function main() {
  const base = 'http://localhost:3000';

  console.log('Signing in...');
  const signInRes = await fetch(`${base}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      csrfToken: '',
      callbackUrl: '/dashboard',
      json: 'true',
      email: 'admin',
      password: '123456',
    }),
    redirect: 'manual',
  });

  console.log('Sign-in status', signInRes.status);
  const cookies = signInRes.headers.get('set-cookie');
  console.log('Set-Cookie:', cookies);
  const body = await signInRes.text();
  console.log('Sign-in body:', body);

  const signInData = JSON.parse(body);
  const redirectUrl = signInData.url;

  console.log('Following redirect to:', redirectUrl);
  const redirectRes = await fetch(redirectUrl, {
    headers: {
      cookie: cookies,
    },
    redirect: 'manual',
  });

  console.log('Redirect status', redirectRes.status);
  const redirectCookies = redirectRes.headers.get('set-cookie');
  console.log('Redirect Set-Cookie:', redirectCookies);
  const allCookies = [cookies, redirectCookies].filter(Boolean).join('; ');

  console.log('Requesting /api/auth/me with all cookies...');
  const meRes = await fetch(`${base}/api/auth/me`, {
    headers: {
      cookie: allCookies,
    },
  });
  console.log('me status', meRes.status);
  console.log('me body', await meRes.text());

  console.log('Requesting /api/dashboard/stats with all cookies...');
  const statsRes = await fetch(`${base}/api/dashboard/stats`, {
    headers: {
      cookie: allCookies,
    },
  });
  console.log('stats status', statsRes.status);
  console.log('stats body', await statsRes.text());
}

main().catch(console.error);
