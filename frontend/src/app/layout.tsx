import './globals.css';
import Navbar from '@/components/Navbar';
import { Providers } from '@/components/Providers';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#1c92d2] animate-gradient-x flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 w-full">
            {/* The direct children of this main tag (from page.tsx files) will now be centered directly on the animated background */}
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
