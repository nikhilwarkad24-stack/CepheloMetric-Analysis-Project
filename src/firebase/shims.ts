import React, { ReactNode } from 'react';

export function initializeFirebase() {
  return {
    firebaseApp: null,
    auth: null,
    firestore: null,
  };
}

export function getSdks() {
  return {
    firebaseApp: null,
    auth: null,
    firestore: null,
  };
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // No-op provider (Firebase removed). Just render children.
  return React.createElement(React.Fragment, null, children);
}

export function useAuth() {
  return null;
}

export function useFirestore() {
  return null;
}

export function useUser() {
  return { user: null, isUserLoading: false, userError: null };
}

export function useDoc<T>(_docRef: any) {
  return { data: null as T | null, isLoading: false, error: null };
}

export function useCollection<T>(_query: any) {
  return { data: null as T[] | null, isLoading: false, error: null };
}

export function useMemoFirebase<T>(factory: () => T, _deps: any[]): T | null {
  try {
    return factory();
  } catch {
    return null;
  }
}

export default null;
