"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, CheckCircle, XCircle, Loader } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { db } from "@/app/service/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { getCurrentUser } from "@/app/service/loginservice"

interface Booking {
  orderId: string
  doctorName: string
  selectedDate: string
  selectedTimes: string[]
  amount: number
  status: string
  createdAt: Date
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const user = getCurrentUser()
      if (!user) {
        console.log('No user logged in')
        setLoading(false)
        return
      }

      console.log('Fetching bookings for user:', user.uid)

      const paymentsRef = collection(db, 'payments')
      // Simplified query without orderBy to avoid index requirement
      const q = query(
        paymentsRef,
        where('userId', '==', user.uid)
      )

      const querySnapshot = await getDocs(q)
      const bookingsData: Booking[] = []

      console.log('Found documents:', querySnapshot.size)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Document data:', data)
        
        // Handle both Timestamp and Date objects
        let createdAtDate = new Date()
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdAtDate = data.createdAt.toDate()
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt
          }
        }

        bookingsData.push({
          orderId: data.orderId || doc.id,
          doctorName: data.doctorName || 'Unknown Doctor',
          selectedDate: data.selectedDate || new Date().toISOString(),
          selectedTimes: data.selectedTimes || [],
          amount: data.amount || 0,
          status: data.status || 'pending',
          createdAt: createdAtDate,
        })
      })

      // Sort by createdAt in memory (newest first)
      bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      console.log('Processed bookings:', bookingsData)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      alert('Gagal memuat riwayat booking. Cek console untuk detail.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBookings()
    }
  }, [isOpen, fetchBookings])

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
          label: 'Berhasil',
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
          label: 'Gagal',
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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-[#1E498E] to-[#3B82F6] text-white p-4 rounded-full shadow-2xl"
      >
        <Calendar className="w-6 h-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-3xl max-h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1E498E] to-[#3B82F6] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Riwayat Booking</h2>
                      <p className="text-sm opacity-90">Jadwal konsultasi Anda</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchBookings}
                      disabled={loading}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50"
                      title="Refresh"
                    >
                      <div className={loading ? "animate-spin" : ""}>
                        ↻
                      </div>
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-[#1E498E] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[#1E498E]/70">Memuat data...</p>
                    </div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="w-16 h-16 text-[#1E498E]/30 mb-4" />
                    <h3 className="text-xl font-bold text-[#1E498E] mb-2">Belum Ada Booking</h3>
                    <p className="text-[#1E498E]/70">Anda belum memiliki jadwal konsultasi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking, index) => {
                      const statusConfig = getStatusConfig(booking.status)
                      return (
                        <motion.div
                          key={booking.orderId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-[#FFF3E0]/30 to-[#B3E5FC]/30 rounded-2xl p-6 border border-[#1E498E]/10"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#1E498E] rounded-full flex items-center justify-center text-white font-bold">
                                {booking.doctorName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-[#1E498E] text-lg">{booking.doctorName}</h3>
                                <p className="text-sm text-[#1E498E]/70">Order ID: {booking.orderId}</p>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color} font-semibold text-sm`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-[#1E498E]">
                              <Calendar className="w-5 h-5" />
                              <span className="font-medium">{formatDate(booking.selectedDate)}</span>
                            </div>

                            <div className="flex items-start gap-3 text-[#1E498E]">
                              <Clock className="w-5 h-5 mt-0.5" />
                              <div className="flex flex-wrap gap-2">
                                {booking.selectedTimes.map((time, idx) => (
                                  <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-[#1E498E]/10">
                              <span className="text-[#1E498E]/70 text-sm">Total Pembayaran</span>
                              <span className="text-[#1E498E] font-bold text-lg">
                                Rp {booking.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
