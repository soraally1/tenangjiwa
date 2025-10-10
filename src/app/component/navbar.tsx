'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUserAsync, isAuthenticatedAsync } from '../service/loginservice';
import { User } from 'firebase/auth';
import { db } from '../service/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Brain, Mic, MessageCircle } from 'lucide-react';
import MobileBottomBar from './Bottombar';
import Bottombar from './Bottombar';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSiTenangMenu, setShowSiTenangMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const siTenangMenuRef = useRef<HTMLDivElement>(null);

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
      if (siTenangMenuRef.current && !siTenangMenuRef.current.contains(event.target as Node)) {
        setShowSiTenangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check authentication status and doctor status
    const checkAuth = async () => {
      const currentUser = await getCurrentUserAsync();
      const authenticated = await isAuthenticatedAsync();
      setUser(currentUser);
      setIsUserAuthenticated(authenticated);
      
      // Check if user is a doctor
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setIsDoctor(userDoc.data().isDoctor === true);
          }
        } catch (error) {
          console.error('Error checking doctor status:', error);
          setIsDoctor(false);
        }
      } else {
        setIsDoctor(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: 'Beranda' },
    { href: '/page/SehatJiwa', label: 'Sehat Jiwa' },
  ];

  const siTenangItems = [
    { href: '/page/mental-assessment', label: 'Deteksi TenJin', icon: <Brain className="w-4 h-4 text-[#1E498E]" /> },
    { href: '/page/suaratenjin', label: 'Suara TenJin', icon: <Mic className="w-4 h-4 text-[#1E498E]" /> },
    { href: '/page/ceritatenjin', label: 'Cerita TenJin', icon: <MessageCircle className="w-4 h-4 text-[#1E498E]" /> },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? '' : 'bg-transparent'}`}>
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
          
          {/* SiTenang Dropdown */}
          <div className="relative" ref={siTenangMenuRef}>
            <button
              onClick={() => setShowSiTenangMenu(!showSiTenangMenu)}
              className={`text-sm px-3 py-2 rounded-full transition-all duration-200 flex items-center gap-1 ${
                siTenangItems.some(item => pathname === item.href)
                  ? 'text-[#1E498E] bg-[#1E498E]/10'
                  : 'text-black/70 hover:text-[#1E498E] hover:bg-black/5'
              }`}
            >
              SiTenang
              <svg className={`w-4 h-4 transition-transform duration-200 ${showSiTenangMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSiTenangMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-[110] pointer-events-auto">
                {siTenangItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setShowSiTenangMenu(false);
                    }}
                    className={`block px-4 py-3 text-sm transition-colors cursor-pointer ${
                      pathname === item.href
                        ? 'text-[#1E498E] bg-[#1E498E]/10 font-medium'
                        : 'text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
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
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl border border-black/10 shadow-lg py-2 z-[110]">
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
                    {isDoctor && (
                      <Link
                        href="/doctor"
                        onClick={() => setShowAccountMenu(false)}
                        className="block px-4 py-2 text-sm text-black/70 hover:text-[#1E498E] hover:bg-[#1E498E]/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Page Dokter
                        </div>
                      </Link>
                    )}
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
            <Bottombar />
    </header>
  );
}


