"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type MobileBottomBarProps = {
  isAuthenticated?: boolean
  userPhotoURL?: string | null
}

export function MobileBottomBar({ isAuthenticated = false, userPhotoURL = null }: MobileBottomBarProps) {
  const pathname = usePathname()
  const [openSiTenang, setOpenSiTenang] = useState(false)
  const firstSiTenangLinkRef = useRef<HTMLAnchorElement | null>(null)

  // Close popup on route change
  useEffect(() => {
    setOpenSiTenang(false)
  }, [pathname])

  // Focus first item when menu opens
  useEffect(() => {
    if (openSiTenang && firstSiTenangLinkRef.current) {
      firstSiTenangLinkRef.current.focus()
    }
  }, [openSiTenang])

  const isActive = (href: string) => pathname === href
  const isAnySiTenangActive = ["/page/mental-assessment", "/page/suaratenjin", "/page/ceritatenjin"].includes(pathname)

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-[9999]"
      aria-label="Bottom navigation"
    >
      {/* safe area support */}
      <div className="h-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <Link
          href="/"
          aria-current={isActive("/") ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1E498E]/40 ${
            isActive("/") ? "text-[#1E498E] bg-[#1E498E]/10" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Sehat Jiwa */}
        <Link
          href="/page/SehatJiwa"
          aria-current={isActive("/page/SehatJiwa") ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1E498E]/40 ${
            isActive("/page/SehatJiwa") ? "text-[#1E498E] bg-[#1E498E]/10" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[10px] font-medium">Sehat</span>
        </Link>

        {/* SiTenang (center) */}
        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={openSiTenang}
            onClick={() => setOpenSiTenang((s) => !s)}
            className={`flex flex-col items-center justify-center w-14 h-14 -mt-6 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1E498E]/40 ${
              isAnySiTenangActive ? "bg-[#1E498E] text-white" : "bg-[#1E498E] text-white"
            }`}
          >
            {/* Brain icon */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 3a3 3 0 00-3 3v1a3 3 0 000 6v2a3 3 0 106 0V6a3 3 0 00-3-3zM19 7a3 3 0 00-3-3 3 3 0 00-3 3v9a3 3 0 106 0v-2a3 3 0 000-6V7z" />
            </svg>
            <span className="text-[9px] font-medium mt-0.5">TenJin</span>
          </button>

          {/* Backdrop */}
          {openSiTenang && (
            <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" onClick={() => setOpenSiTenang(false)} />
          )}

          {/* Menu */}
          {openSiTenang && (
            <div
              role="menu"
              aria-label="SiTenang menu"
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100"
            >
              <Link
                ref={firstSiTenangLinkRef}
                href="/page/mental-assessment"
                role="menuitem"
                className={`flex items-center gap-3 px-4 py-3 transition-colors focus:bg-[#1E498E]/10 focus:outline-none ${
                  isActive("/page/mental-assessment")
                    ? "bg-[#1E498E]/10 text-[#1E498E]"
                    : "text-gray-700 hover:bg-gray-50"
                } border-b border-gray-100`}
              >
                {/* Brain icon small */}
                <svg className="w-4 h-4 text-[#1E498E]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 3a3 3 0 00-3 3v1a3 3 0 000 6v2a3 3 0 106 0V6a3 3 0 00-3-3zM19 7a3 3 0 00-3-3 3 3 0 00-3 3v9a3 3 0 106 0v-2a3 3 0 000-6V7z" />
                </svg>
                <span className="text-sm font-medium">Deteksi TenJin</span>
              </Link>
              <Link
                href="/page/suaratenjin"
                role="menuitem"
                className={`flex items-center gap-3 px-4 py-3 transition-colors focus:bg-[#1E498E]/10 focus:outline-none ${
                  isActive("/page/suaratenjin") ? "bg-[#1E498E]/10 text-[#1E498E]" : "text-gray-700 hover:bg-gray-50"
                } border-b border-gray-100`}
              >
                {/* Mic icon small */}
                <svg className="w-4 h-4 text-[#1E498E]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
                  <path d="M19 11a7 7 0 01-14 0h2a5 5 0 0010 0h2z" />
                  <path d="M11 19h2v2h-2z" />
                </svg>
                <span className="text-sm font-medium">Suara TenJin</span>
              </Link>
              <Link
                href="/page/ceritatenjin"
                role="menuitem"
                className={`flex items-center gap-3 px-4 py-3 transition-colors focus:bg-[#1E498E]/10 focus:outline-none ${
                  isActive("/page/ceritatenjin") ? "bg-[#1E498E]/10 text-[#1E498E]" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {/* Message icon small */}
                <svg className="w-4 h-4 text-[#1E498E]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 4v-4H6a2 2 0 01-2-2V5z" />
                </svg>
                <span className="text-sm font-medium">Cerita TenJin</span>
              </Link>
            </div>
          )}
        </div>

        {/* Konsultasi */}
        <Link
          href="/konsultasi"
          aria-current={isActive("/konsultasi") ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1E498E]/40 ${
            isActive("/konsultasi") ? "text-[#1E498E] bg-[#1E498E]/10" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
          <span className="text-[10px] font-medium">Chat</span>
        </Link>

        {/* Profile / Login */}
        <Link
          href={isAuthenticated ? "/page/profile" : "/page/login"}
          aria-current={isActive("/page/profile") || isActive("/page/login") ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1E498E]/40 ${
            isActive("/page/profile") || isActive("/page/login")
              ? "text-[#1E498E] bg-[#1E498E]/10"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {isAuthenticated && userPhotoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userPhotoURL || "/placeholder.svg"}
              alt="Profile"
              width={24}
              height={24}
              className="w-6 h-6 rounded-full mb-1 object-cover"
            />
          ) : (
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-[10px] font-medium">{isAuthenticated ? "Profil" : "Login"}</span>
        </Link>
      </div>
    </nav>
  )
}

export default MobileBottomBar
