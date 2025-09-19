"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentUser, logout } from "../../service/loginservice"
import { User } from "firebase/auth"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'history'>('profile')
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/page/login')
      return
    }
    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#1E498E]/30 border-t-[#1E498E] rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] py-8 px-4">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-[#B3E5FC]/30 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-40 h-40 bg-[#FFF3E0]/40 rounded-full blur-xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1E498E] mb-2">Profil Saya</h1>
          <p className="text-[#1E498E]/70">Kelola informasi dan pengaturan akun Anda</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/50 shadow-2xl overflow-hidden mb-8"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#1E498E] to-[#1E498E]/80 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
              </motion.div>
              
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  {user.displayName || 'Pengguna'}
                </h2>
                <p className="text-white/80 mb-2">{user.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Terverifikasi
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Member Sejak {formatDate(new Date(user.metadata.creationTime!))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'profile', label: 'Profil', icon: '👤' },
                { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
                { id: 'history', label: 'Riwayat', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'settings' | 'history')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#1E498E] border-b-2 border-[#1E498E] bg-[#1E498E]/5'
                      : 'text-gray-500 hover:text-[#1E498E] hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-[#1E498E] mb-4">Informasi Profil</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.displayName || 'Belum diatur'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.email}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Pengguna</label>
                    <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm">
                      {user.uid}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terakhir Login</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.metadata.lastSignInTime ? formatDate(new Date(user.metadata.lastSignInTime)) : 'Tidak tersedia'}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-[#1E498E] mb-3">Statistik Akun</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-blue-600">Sesi Konsultasi</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-green-600">Artikel Dibaca</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-600">Tes Selesai</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-[#1E498E] mb-4">Pengaturan Akun</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifikasi Email</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Mode Gelap</h4>
                      <p className="text-sm text-gray-600">Gunakan tema gelap</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Bahasa</h4>
                      <p className="text-sm text-gray-600">Pilih bahasa antarmuka</p>
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E498E] focus:border-[#1E498E]">
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-[#1E498E] mb-3">Keamanan</h4>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="font-medium text-gray-900">Ubah Password</div>
                      <div className="text-sm text-gray-600">Perbarui kata sandi Anda</div>
                    </button>
                    <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="font-medium text-gray-900">Verifikasi Email</div>
                      <div className="text-sm text-gray-600">Konfirmasi alamat email Anda</div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-[#1E498E] mb-4">Riwayat Aktivitas</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Akun Dibuat</h4>
                        <p className="text-sm text-gray-600">{formatDate(new Date(user.metadata.creationTime!))}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Login Terakhir</h4>
                        <p className="text-sm text-gray-600">
                          {user.metadata.lastSignInTime ? formatDate(new Date(user.metadata.lastSignInTime)) : 'Tidak tersedia'}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg opacity-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Konsultasi Pertama</h4>
                        <p className="text-sm text-gray-600">Belum ada konsultasi</p>
                      </div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-[#1E498E] mb-3">Grafik Aktivitas</h4>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                    </svg>
                    <p className="text-gray-500">Belum ada data aktivitas</p>
                    <p className="text-sm text-gray-400">Mulai gunakan layanan untuk melihat riwayat</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isLoggingOut ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Keluar...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
