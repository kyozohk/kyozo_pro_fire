'use client';

import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      {children}
    </FirebaseClientProvider>
  );
}
