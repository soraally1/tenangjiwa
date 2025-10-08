"use client"
import { motion } from "framer-motion"
import { Calendar, Clock, CheckCircle, XCircle, Loader, Users, MessageCircle, Stethoscope } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/app/service/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import Navbar from "../component/navbar"

interface Appointment {
  orderId: string
  userId: string
  userName: string
  userEmail: string
  selectedDate: string
  selectedTimes: string[]
  amount: number
  status: string
  createdAt: Date
}

interface DoctorData {
  isDoctor: boolean
  name: string
  email: string
  specialty?: string
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    console.log('=== DOCTOR DASHBOARD LOADED ===')
    // Wait for auth state to be ready
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user')
      if (user) {
        checkDoctorAccess(user)
      } else {
        console.log('No user logged in, redirecting to /login')
        router.push('/login')
        setChecking(false)
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkDoctorAccess = async (user: User) => {
    try {
      console.log('Checking doctor access for user:', user.uid)

      console.log('Fetching user document for UID:', user.uid)

      // Get user data from Firestore
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      console.log('User document exists:', userDoc.exists())

      if (!userDoc.exists()) {
        console.log('User document does not exist in Firestore')
        alert('Data user tidak ditemukan. Silakan logout dan login kembali.')
        router.push('/')
        return
      }

      const userData = userDoc.data()
      console.log('User data from Firestore:', userData)

      // Check if user is a doctor - handle both boolean and string values
      const isDoctorValue = userData?.isDoctor
      console.log('isDoctor value:', isDoctorValue, 'type:', typeof isDoctorValue)

      const isDoctor = isDoctorValue === true || isDoctorValue === 'true'

      if (!isDoctor) {
        console.log('User is not a doctor, access denied')
        alert('Akses ditolak! Halaman ini hanya untuk dokter.')
        router.push('/')
        return
      }

      console.log('User is a doctor, granting access')

      setDoctorData({
        isDoctor: true,
        name: userData.displayName || user.displayName || 'Unknown Doctor',
        email: userData.email || user.email || '',
        specialty: userData.specialty || undefined
      })

      console.log('Fetching appointments for doctor:', user.uid)
      
      await fetchAppointments(user.uid)
    } catch (error) {
      console.error('Error checking doctor access:', error)
      alert('Terjadi kesalahan saat memeriksa akses: ' + (error instanceof Error ? error.message : 'Unknown error'))
      router.push('/')
    } finally {
      setChecking(false)
    }
  }

  const fetchAppointments = async (doctorId: string) => {
    try {
      setLoading(true)
      
      // Query appointments by doctorId
      const paymentsRef = collection(db, 'payments')
      
      // Query by doctorId (which matches the Firebase user UID)
      const q = query(
        paymentsRef,
        where('doctorId', '==', doctorId)
      )

      const querySnapshot = await getDocs(q)
      const appointmentsData: Appointment[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()

        let createdAtDate = new Date()
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdAtDate = data.createdAt.toDate()
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt
          }
        }

        appointmentsData.push({
          orderId: data.orderId || doc.id,
          userId: data.userId || 'unknown',
          userName: data.userName || 'Unknown',
          userEmail: data.userEmail || '',
          selectedDate: data.selectedDate || new Date().toISOString(),
          selectedTimes: data.selectedTimes || [],
          amount: data.amount || 0,
          status: data.status || 'pending',
          createdAt: createdAtDate,
        })
      })

      // Sort by date (newest first)
      appointmentsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Dikonfirmasi',
          color: 'bg-green-100 text-green-700',
          icon: <CheckCircle className="w-4 h-4" />
        }
      case 'pending':
        return {
          label: 'Menunggu',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <Loader className="w-4 h-4 animate-spin" />
        }
      case 'failed':
        return {
          label: 'Dibatalkan',
          color: 'bg-red-100 text-red-700',
          icon: <XCircle className="w-4 h-4" />
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-700',
          icon: <Clock className="w-4 h-4" />
        }
    }
  }


  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'paid').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    cancelled: appointments.filter(a => a.status === 'failed').length,
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#1E498E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#1E498E] text-lg font-semibold">Memeriksa akses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24 pb-24 sm:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E498E] rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard Dokter
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Selamat datang, <span className="font-semibold text-[#1E498E]">{doctorData?.name}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#1E498E]/10 rounded-full mb-3 sm:mb-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#1E498E]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Janji Temu</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.confirmed}</div>
            <div className="text-xs sm:text-sm text-gray-600">Dikonfirmasi</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-gray-600">Menunggu</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.cancelled}</div>
            <div className="text-xs sm:text-sm text-gray-600">Dibatalkan</div>
          </motion.div>
        </div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E498E]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Daftar Janji Temu</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Semua jadwal konsultasi pasien Anda</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#1E498E] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600">Memuat data...</p>
                  </div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Belum Ada Janji Temu</h3>
                  <p className="text-sm sm:text-base text-gray-600 px-4">Anda belum memiliki jadwal konsultasi</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                {appointments.map((appointment, index) => {
                  const statusConfig = getStatusConfig(appointment.status)
                  return (
                    <motion.div
                      key={appointment.orderId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-200 pb-4 sm:pb-6 hover:bg-gray-50 transition-colors px-2 sm:px-0"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4 flex-col sm:flex-row gap-3 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E498E] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            {appointment.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[#1E498E] text-base sm:text-lg truncate">{appointment.userName}</h3>
                            <p className="text-xs sm:text-sm text-[#1E498E]/70 truncate">{appointment.userEmail}</p>
                            <p className="text-xs text-[#1E498E]/50 mt-1">Order: {appointment.orderId}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${statusConfig.color} font-semibold text-xs sm:text-sm whitespace-nowrap`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 text-[#1E498E]">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{formatDate(appointment.selectedDate)}</span>
                        </div>

                        <div className="flex items-start gap-2 sm:gap-3 text-[#1E498E]">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {appointment.selectedTimes.map((time, idx) => (
                              <span key={idx} className="bg-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[#1E498E]/10">
                        <span className="text-[#1E498E]/70 text-xs sm:text-sm">Pembayaran</span>
                        <span className="text-[#1E498E] font-bold text-base sm:text-lg">
                          Rp {appointment.amount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Join Consultation Room Button */}
                      {appointment.status === 'paid' && (
                        <motion.button
                          onClick={() => router.push(`/page/konsulroom?appointmentId=${appointment.orderId}`)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-[#1E498E] to-[#3B82F6] text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Masuk Ruang Konsultasi
                        </motion.button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
        </motion.div>
      </div>
    </div>
  )
}
