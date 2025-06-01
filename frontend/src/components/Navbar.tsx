'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnection from './WalletConnection';

const navLinks = [
  { href: '/playground', label: 'Playground' },
  { href: '/marketplace', label: 'Marketplace' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full bg-gradient-to-r from-blue-700 via-purple-700 to-black shadow-lg py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* ETHGlobal Logo Placeholder */}
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-lg text-blue-700 shadow-md">
          E
        </div>
        <span className="text-white text-2xl font-bold tracking-tight">Proofs of Inference</span>
      </div>
      <WalletConnection />
      <div className="flex items-center gap-6">
        <div className="flex gap-6">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-lg font-medium transition-colors px-3 py-1 rounded-md
                ${pathname === link.href ? 'bg-white text-blue-700 shadow' : 'text-white hover:bg-white/20'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 