'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '../service/loginservice';
import { User } from 'firebase/auth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const pathname = usePathname();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      const authenticated = isAuthenticated();
      setUser(currentUser);
      setIsUserAuthenticated(authenticated);
    };

    checkAuth();

    // Listen for auth state changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: 'Beranda' },
    { href: '/page/aipage', label: 'SiTenang' },
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
          
          {/* Account Dropdown */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="text-sm px-3 py-2 rounded-full transition-all duration-200 text-black/70 hover:text-[#1E498E] hover:bg-black/5 flex items-center gap-1"
            >
              {isUserAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-[#1E498E]/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#1E498E]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                  <span className="hidden md:block">{user.displayName || 'Profil'}</span>
                </div>
              ) : (
                'Akun'
              )}
              <svg className={`w-4 h-4 transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl border border-black/10 shadow-lg py-2 z-50">
                {isUserAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.displayName || 'Pengguna'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/page/profile"
                      onClick={() => setShowAccountMenu(false)}
                      className="block px-4 py-2 text-sm text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Saya
                      </div>
                    </Link>
                    <Link
                      href="/page/settings"
                      onClick={() => setShowAccountMenu(false)}
                      className="block px-4 py-2 text-sm text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pengaturan
                      </div>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        // Logout will be handled by the profile page
                        window.location.href = '/page/profile';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Keluar
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/page/login"
                      onClick={() => setShowAccountMenu(false)}
                      className="block px-4 py-2 text-sm text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Masuk
                      </div>
                    </Link>
                    <Link
                      href="/page/signup"
                      onClick={() => setShowAccountMenu(false)}
                      className="block px-4 py-2 text-sm text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Daftar
                      </div>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          
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
          <Link href={isUserAuthenticated ? "/page/profile" : "/page/login"} className={`flex flex-col items-center justify-center py-2 rounded-xl ${pathname === '/page/profile' || pathname === '/page/login' ? 'text-[#1E498E] bg-[#1E498E]/10' : 'text-black/70'}`}>
            {isUserAuthenticated && user ? (
              user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M3.75 4.5A2.25 2.25 0 016 2.25h6A2.25 2.25 0 0114.25 4.5v15a.75.75 0 01-1.5 0V4.5A.75.75 0 0012 3.75H6A.75.75 0 005.25 4.5v15a.75.75 0 01-1.5 0v-15zm9.72 8.28a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06L11.44 13.5H21a.75.75 0 000-1.5h-9.56l1.97-1.97a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-xs mt-0.5">{isUserAuthenticated ? 'Profil' : 'Masuk'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}


