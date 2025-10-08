"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentUserAsync, logout } from "../../service/loginservice"
import { User } from "firebase/auth"
import { db } from "../../service/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { User as UserIcon, Calendar, Clock, TrendingUp, MessageCircle, CheckCircle } from "lucide-react"
import Navbar from "@/app/component/navbar"

interface Consultation {
  id: string
  userId: string
  doctorId?: string
  doctorName?: string
  price?: number
  paymentMethod?: string
  status: 'completed' | 'pending' | 'cancelled'
  notes?: string
  createdAt?: Date
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'consultations'>('profile')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  })
  const [loadingConsultations, setLoadingConsultations] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUserAsync()
      if (!currentUser) {
        router.push('/page/login')
        return
      }
      setUser(currentUser)
      setIsLoading(false)
      
      // Load consultations
      loadConsultations(currentUser.uid)
    }
    
    initAuth()
  }, [router])

  const loadConsultations = async (userId: string) => {
    setLoadingConsultations(true)
    try {
      const paymentsRef = collection(db, 'payments')
      const q = query(
        paymentsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const consultationsData: Consultation[] = []
      
      const stats = {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        consultationsData.push({
          id: doc.id,
          userId: data.userId || '',
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          price: data.price,
          paymentMethod: data.paymentMethod,
          status: data.status || 'pending',
          notes: data.notes,
          createdAt: data.createdAt?.toDate()
        })
        
        stats.total++
        if (data.status === 'completed') stats.completed++
        else if (data.status === 'cancelled') stats.cancelled++
        else stats.pending++
      })
      
      setConsultations(consultationsData)
      setConsultationStats(stats)
    } catch (error) {
      console.error('Error loading consultations:', error)
    } finally {
      setLoadingConsultations(false)
    }
  }

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
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-[#1E498E]/20">
              <div className="flex items-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1E498E] to-blue-600 rounded-full flex items-center justify-center">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={76}
                        height={76}
                        className="w-[76px] h-[76px] rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </motion.div>
                
                <div>
                  <h1 className="text-3xl font-bold text-[#1E498E] mb-1">
                    {user.displayName || 'Pengguna'}
                  </h1>
                  <p className="text-gray-600 mb-2">{user.email}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Terverifikasi
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">Member sejak {formatDate(new Date(user.metadata.creationTime!))}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 font-medium transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-6 mb-8 border-b border-gray-200"
          >
            {[
              { id: 'profile', label: 'Informasi Profil', icon: <UserIcon className="w-4 h-4" /> },
              { id: 'consultations', label: 'Riwayat Konsultasi', icon: <MessageCircle className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'consultations')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-[#1E498E]'
                    : 'text-gray-500 hover:text-[#1E498E]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E498E]"
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <div>
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/70 backdrop-blur-sm p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-[#1E498E]">{consultationStats.total}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Konsultasi</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{consultationStats.completed}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Selesai</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-1">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-600">{consultationStats.pending}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Berlangsung</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-4 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-1">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">
                        {consultationStats.total > 0 ? Math.round((consultationStats.completed / consultationStats.total) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Progress</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4 pb-20">
                  <h3 className="text-lg font-semibold text-[#1E498E] mb-4">Detail Akun</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start py-3 border-b border-gray-200">
                      <div className="w-32 text-sm font-medium text-gray-600">Nama Lengkap</div>
                      <div className="flex-1 text-sm text-[#1E498E] font-semibold">{user.displayName || 'Belum diatur'}</div>
                    </div>
                    
                    <div className="flex items-start py-3 border-b border-gray-200">
                      <div className="w-32 text-sm font-medium text-gray-600">Email</div>
                      <div className="flex-1 text-sm text-[#1E498E] font-semibold">{user.email}</div>
                    </div>
                    
                    <div className="flex items-start py-3 border-b border-gray-200">
                      <div className="w-32 text-sm font-medium text-gray-600">ID Pengguna</div>
                      <div className="flex-1 text-xs font-mono text-gray-700">{user.uid}</div>
                    </div>
                    
                    <div className="flex items-start py-3">
                      <div className="w-32 text-sm font-medium text-gray-600">Terakhir Login</div>
                      <div className="flex-1 text-sm text-gray-700">
                        {user.metadata.lastSignInTime ? formatDate(new Date(user.metadata.lastSignInTime)) : 'Tidak tersedia'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'consultations' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#1E498E]">Riwayat Konsultasi</h3>
                  <span className="text-sm text-gray-500">{consultations.length} konsultasi</span>
                </div>
                
                {loadingConsultations ? (
                  <div className="flex justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-8 h-8 border-4 border-[#1E498E]/30 border-t-[#1E498E] rounded-full"
                    />
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium mb-2">Belum ada riwayat konsultasi</p>
                    <p className="text-sm text-gray-400">Mulai konsultasi pertama Anda untuk mendapatkan bantuan profesional</p>
                  </div>
                ) : (
                  <>
                    {/* Timeline List */}
                    <div className="space-y-4 mb-8">
                      {consultations.map((consultation, index) => (
                        <motion.div
                          key={consultation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                        >
                          <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                            consultation.status === 'completed' ? 'bg-green-500' :
                            consultation.status === 'cancelled' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          
                          <div className="bg-white/70 backdrop-blur-sm p-4 hover:bg-white/90 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-[#1E498E] mb-1">
                                  Konsultasi dengan {consultation.doctorName || 'Dokter'}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {consultation.createdAt ? formatDate(consultation.createdAt) : 'Tanggal tidak tersedia'}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-medium ${
                                consultation.status === 'completed' ? 'bg-green-100 text-green-700' :
                                consultation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {consultation.status === 'completed' ? 'Selesai' :
                                 consultation.status === 'cancelled' ? 'Dibatalkan' :
                                 'Berlangsung'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-6 mt-3 text-sm">
                              <div>
                                <span className="text-gray-500">Biaya: </span>
                                <span className="font-semibold text-[#1E498E]">
                                  Rp {consultation.price?.toLocaleString('id-ID') || '0'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Pembayaran: </span>
                                <span className="font-medium text-gray-700">{consultation.paymentMethod || '-'}</span>
                              </div>
                            </div>

                            {consultation.notes && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Catatan:</p>
                                <p className="text-sm text-gray-700">{consultation.notes}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Progress Kesehatan Mental</h4>
                        <span className="text-2xl font-bold text-purple-600">
                          {consultationStats.total > 0 ? Math.round((consultationStats.completed / consultationStats.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${consultationStats.total > 0 ? (consultationStats.completed / consultationStats.total) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        {consultationStats.completed} dari {consultationStats.total} konsultasi selesai
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
