"use client"
import { motion } from "framer-motion"
import { Calendar, Clock, CheckCircle, XCircle, Loader, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/app/service/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import Navbar from "../component/navbar"

interface Appointment {
  orderId: string
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

      const doctorName = userData.displayName || user.displayName || 'Unknown Doctor'
      console.log('Fetching appointments for doctor:', doctorName)
      
      await fetchAppointments(user.uid, doctorName)
    } catch (error) {
      console.error('Error checking doctor access:', error)
      alert('Terjadi kesalahan saat memeriksa akses: ' + (error instanceof Error ? error.message : 'Unknown error'))
      router.push('/')
    } finally {
      setChecking(false)
    }
  }

  const fetchAppointments = async (doctorId: string, doctorName: string) => {
    try {
      setLoading(true)
      
      // Query appointments by doctorId or doctorName
      const paymentsRef = collection(db, 'payments')
      
      // Try to find by doctorName first (since we're storing doctorName in konsultasi)
      const q = query(
        paymentsRef,
        where('doctorName', '==', doctorName)
      )

      const querySnapshot = await getDocs(q)
      const appointmentsData: Appointment[] = []

      console.log('Found appointments:', querySnapshot.size)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Appointment data:', data)

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
    <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1E498E] mb-2">
            Dashboard Dokter
          </h1>
          <p className="text-[#1E498E]/70">
            Selamat datang, <span className="font-semibold">{doctorData?.name}</span>
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1E498E]/70 text-sm font-medium mb-1">Total Janji Temu</p>
                <p className="text-3xl font-bold text-[#1E498E]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#1E498E]/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#1E498E]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700/70 text-sm font-medium mb-1">Dikonfirmasi</p>
                <p className="text-3xl font-bold text-green-700">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700/70 text-sm font-medium mb-1">Menunggu</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700/70 text-sm font-medium mb-1">Dibatalkan</p>
                <p className="text-3xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#1E498E] to-[#3B82F6] p-6 text-white">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Daftar Janji Temu</h2>
                <p className="text-sm opacity-90">Semua jadwal konsultasi pasien Anda</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-[#1E498E] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[#1E498E]/70">Memuat data...</p>
                </div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-[#1E498E]/30 mb-4" />
                <h3 className="text-xl font-bold text-[#1E498E] mb-2">Belum Ada Janji Temu</h3>
                <p className="text-[#1E498E]/70">Anda belum memiliki jadwal konsultasi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment, index) => {
                  const statusConfig = getStatusConfig(appointment.status)
                  return (
                    <motion.div
                      key={appointment.orderId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-[#FFF3E0]/30 to-[#B3E5FC]/30 rounded-2xl p-6 border border-[#1E498E]/10 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#1E498E] rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1E498E] text-lg">{appointment.userName}</h3>
                            <p className="text-sm text-[#1E498E]/70">{appointment.userEmail}</p>
                            <p className="text-xs text-[#1E498E]/50 mt-1">Order: {appointment.orderId}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color} font-semibold text-sm`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-[#1E498E]">
                          <Calendar className="w-5 h-5" />
                          <span className="font-medium">{formatDate(appointment.selectedDate)}</span>
                        </div>

                        <div className="flex items-start gap-3 text-[#1E498E]">
                          <Clock className="w-5 h-5 mt-0.5" />
                          <div className="flex flex-wrap gap-2">
                            {appointment.selectedTimes.map((time, idx) => (
                              <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1E498E]/10">
                        <span className="text-[#1E498E]/70 text-sm">Pembayaran</span>
                        <span className="text-[#1E498E] font-bold text-lg">
                          Rp {appointment.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
