export async function generateCodeVerifier() {
  const array = new Uint8Array(128);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function base64UrlEncode(buffer: Uint8Array) {
  // btoa works on binary string in browser
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

export async function generateCodeChallenge(verifier: string) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

export async function startGoogleOAuth(clientId: string, nextPath?: string) {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  // store verifier for later exchange
  sessionStorage.setItem('pkce_code_verifier', verifier);

  const redirectUri = `${window.location.origin}/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  });

  // Use the OAuth 'state' parameter to carry the intended post-login redirect (next)
  if (nextPath) {
    params.set('state', nextPath);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  window.location.href = authUrl;
}
