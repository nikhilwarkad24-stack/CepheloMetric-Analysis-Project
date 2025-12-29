export type UserData = {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'user' | 'admin';
};

export function getUserFromStorage(): UserData | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  // Token is in httpOnly cookie - cleared on server via logout endpoint
}

export function isLoggedIn(): boolean {
  // Check if user data is in localStorage
  // Token validity is checked server-side via httpOnly cookie
  return getUserFromStorage() !== null;
}
