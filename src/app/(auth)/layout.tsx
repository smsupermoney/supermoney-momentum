import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-6">
        <img
          src="/assets/images/logo.png" // path from public/
          alt="Logo"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div className="w-full max-w-sm" autoComplete="off">
        {children}
      </div>
    </main>
  );
}
