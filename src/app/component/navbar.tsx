'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Beranda' },
    { href: '/page/aipage', label: 'AI Bantuan' },
    { href: '/page/login', label: 'Masuk' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? '' : 'bg-transparent'}`}>
      <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">

          <div className="leading-tight">
            <span className="text-[#1E498E] font-semibold">Tenang Jiwa</span>
            <span className="block text-[11px] text-[#1E498E] mt-0.5">Kenali Perasaan Jiwa Kamu</span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm px-3 py-2 rounded-full transition-all duration-200 ${active ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70 hover:text-[#1E498E] hover:bg-black/5'}`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/page/signup" className="ml-2 text-sm text-white bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 rounded-full hover:shadow-[0_8px_24px_rgba(236,72,153,0.35)] transition-shadow">
            Daftar
          </Link>
          <Link href="/konsultasi" className="ml-2 text-sm text-white bg-[#1E498E] px-4 py-2 rounded-full hover:shadow-[0_8px_24px_rgba(30,73,142,0.35)] transition-shadow">
            Konsultasi
          </Link>
        </div>
      </nav>

      {/* Bottom navigation for mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-2 py-1 grid grid-cols-4 gap-1">
          <Link href="/" className={`flex flex-col items-center justify-center py-2 rounded-xl ${pathname === '/' ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.25 8.25a.75.75 0 01-1.06 1.06l-.72-.72V20.5A2.5 2.5 0 0016.5 23h-9A2.5 2.5 0 005 20.5v-8.07l-.72.72a.75.75 0 01-1.06-1.06l8.25-8.25z"/>
            </svg>
            <span className="text-xs mt-0.5">Beranda</span>
          </Link>
          <Link href="/page/aipage" className={`flex flex-col items-center justify-center py-2 rounded-xl ${pathname === '/page/aipage' ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v10.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75zm3 1.5a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9zm0 3a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9zm0 3a.75.75 0 000 1.5h5.25a.75.75 0 000-1.5H7.5z" />
            </svg>
            <span className="text-xs mt-0.5">AI</span>
          </Link>
          <Link href="/konsultasi" className={`flex flex-col items-center justify-center py-2 rounded-xl ${pathname === '/konsultasi' ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm6.967-2.28a.75.75 0 10-1.06 1.06L11.31 14l4.97-4.97a.75.75 0 00-1.06-1.06L11.31 11.88 9.217 9.72z" clipRule="evenodd" />
            </svg>
            <span className="text-xs mt-0.5">Konsultasi</span>
          </Link>
          <Link href="/page/login" className={`flex flex-col items-center justify-center py-2 rounded-xl ${pathname === '/page/login' ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M3.75 4.5A2.25 2.25 0 016 2.25h6A2.25 2.25 0 0114.25 4.5v15a.75.75 0 01-1.5 0V4.5A.75.75 0 0012 3.75H6A.75.75 0 005.25 4.5v15a.75.75 0 01-1.5 0v-15zm9.72 8.28a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06L11.44 13.5H21a.75.75 0 000-1.5h-9.56l1.97-1.97a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs mt-0.5">Masuk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}


