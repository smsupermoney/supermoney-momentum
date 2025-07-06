
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/contexts/app-context';
import { LanguageProvider } from '@/contexts/language-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Supermoney Sales Hub',
  description: 'CRM for Supermoney.in Sales Team',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </AppProvider>
      </body>
    </html>
  );
}
