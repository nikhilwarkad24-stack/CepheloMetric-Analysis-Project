// Global ambient types to avoid missing declaration errors in the dev environment

declare module 'react';
declare module 'react/jsx-runtime';
declare module 'lucide-react';
declare module 'next/link';
declare module 'next/navigation';

// Provide a very permissive JSX IntrinsicElements to avoid many JSX type errors
// This keeps the repo compilable in environments where @types/react isn't installed.

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
