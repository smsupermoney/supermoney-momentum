import React from 'react';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-6">
           <Logo className="text-primary h-10 w-10" />
           <h1 className="text-3xl font-headline font-bold text-primary">Supermoney</h1>
      </div>
      <div className="w-full max-w-sm" autoComplete="off">
        {children}
      </div>
    </main>
  );
}
