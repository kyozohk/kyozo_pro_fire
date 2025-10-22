'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  console.log('🔥 FirebaseClientProvider - Initializing');
  
  const firebaseServices = useMemo(() => {
    console.log('🔥 FirebaseClientProvider - Initializing Firebase services');
    // Initialize Firebase on the client side, once per component mount.
    try {
      const services = initializeFirebase();
      console.log('✅ FirebaseClientProvider - Firebase initialized:', {
        hasApp: !!services.firebaseApp,
        hasAuth: !!services.auth,
        hasFirestore: !!services.firestore
      });
      return services;
    } catch (error) {
      console.error('❌ FirebaseClientProvider - Error initializing Firebase:', error);
      throw error;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  console.log('🔥 FirebaseClientProvider - Rendering provider with services');
  
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}