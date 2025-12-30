// Repo-root ambient declarations to help local dev environments without @types packages

declare module 'react';
declare module 'react/jsx-runtime';
declare module 'lucide-react';
declare module 'next/link';
declare module 'next/navigation';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
