"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    const verifier = sessionStorage.getItem('pkce_code_verifier');
    if (!code) {
      setError('Missing authorization code');
      return;
    }
    if (!verifier) {
      setError('Missing PKCE verifier (session expired).');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/google/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, code_verifier: verifier }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Token exchange failed');
          return;
        }

        // Token is already set in httpOnly cookie by the API
        // Store only user data in localStorage (non-sensitive)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Clear session storage
        sessionStorage.removeItem('pkce_code_verifier');

        // Notify other parts of the app in this tab that the user changed
        try {
          window.dispatchEvent(new Event('user-changed'));
        } catch (e) {
          // ignore if window not available
        }

        // Redirect based on user role
        const redirectPath = data.user?.role === 'admin' ? '/admin/dashboard' : '/';
        router.push(redirectPath);
      } catch (e: any) {
        setError(e.message || String(e));
      }
    })();
  }, [router]);

  if (error) return <div className="p-6 text-red-600">Error during sign-in: {error}</div>;
  return <div className="p-6">Completing sign-in...</div>;
}

