
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return <div className="flex items-center justify-center min-h-screen">Redirecting to admin dashboard...</div>;
}
