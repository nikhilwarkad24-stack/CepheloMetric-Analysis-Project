declare module '@/firebase' {
  export const initializeFirebase: any;
  export const FirebaseClientProvider: any;
  export function useAuth(): any;
  export function useFirestore(): any;
  export function useUser(): { user: any; isUserLoading: boolean; userError: any };
  export function useDoc<T>(docRef: any): { data: T | null; isLoading: boolean; error: any };
  export function useCollection<T>(query: any): { data: T[] | null; isLoading: boolean; error: any };
  export function useMemoFirebase<T>(factory: () => T, deps: any[]): T | null;
  export const getSdks: any;
  export const firebaseConfig: any;
}

declare module '@/firebase/provider' {
  export function useAuth(): any;
  export function useFirestore(): any;
  export function useUser(): { user: any; isUserLoading: boolean; userError: any };
  export function useDoc<T>(docRef: any): { data: T | null; isLoading: boolean; error: any };
  export function useCollection<T>(query: any): { data: T[] | null; isLoading: boolean; error: any };
  export function useMemoFirebase<T>(factory: () => T, deps: any[]): T | null;
}

declare module '@/firebase/firestore/use-collection' {
  export function useCollection<T>(query: any): { data: T[] | null; isLoading: boolean; error: any };
}

declare module '@/firebase/firestore/use-doc' {
  export function useDoc<T>(docRef: any): { data: T | null; isLoading: boolean; error: any };
}
