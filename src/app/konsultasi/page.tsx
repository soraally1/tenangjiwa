"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, CheckCircle, Calendar, Stethoscope, Star } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Navbar from "../component/navbar"
// Types
interface Doctor {
  id: string
  name: string
  specialty: string
  experience: string
  rating: number
  image: string
  description: string
  schedules: TimeSlot[]
}

interface TimeSlot {
  session: string
  time: string
}

interface BookedSlots {
  [key: string]: {
    isBooked: boolean
    status?: string
  }
}

interface User {
  uid: string
  email: string
  displayName?: string
}

const CONSULTATION_PRICE = 25000

const doctors: Doctor[] = [
  {
    id: "dr-stevanus",
    name: "dr. Stevanus Ingwantoro",
    specialty: "Sp.KJ - Psikiater",
    experience: "20+ tahun pengalaman",
    rating: 4.9,
    image: "/dr-Stevanus.png",
    description:
      "Salah satu psikiater terbaik di Jakarta dengan pengalaman lebih dari 20 tahun dalam menangani berbagai kasus kesehatan mental.",
    schedules: [
      { session: "Sesi Pagi", time: "08:00-09:00" },
      { session: "Sesi Pagi", time: "11:00-12:00" },
      { session: "Sesi Siang", time: "13:00-14:00" },
    ],
  },
  {
    id: "dr-yossy",
    name: "dr. Yossy Agustanti",
    specialty: "Sp.KJ - Psikiater",
    experience: "15+ tahun pengalaman",
    rating: 4.8,
    image: "/dr-yossy.jpg",
    description:
      "Psikiater berpengalaman yang aktif dalam mengatasi stigma kesehatan mental dan memberikan pelayanan terbaik.",
    schedules: [
      { session: "Sesi Pagi", time: "09:00-10:00" },
      { session: "Sesi Siang", time: "14:00-15:00" },
      { session: "Sesi Siang", time: "15:30-16:30" },
    ],
  },
]

export default function Konsultasi() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState(1)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<BookedSlots>({})

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  // Format date to display
  const formatDate = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
    }
  }

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Add previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false })
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Add next month's days to complete the calendar
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  // Navigate months
  const navigateMonth = (direction: number) => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(prevMonth.getMonth() + direction)
      return newMonth
    })
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleTimeSelection = (time: string) => {
    if (bookedSlots[time]?.isBooked) return

    setSelectedTimes((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time)
      } else if (prev.length < 5) {
        return [...prev, time]
      }
      return prev
    })
  }

  // Payment Steps Component
  const PaymentSteps = ({ currentStep }: { currentStep: number }) => (
    <motion.div
      className="flex justify-between items-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <motion.div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep
                ? "bg-[#1E498E] text-white shadow-lg"
                : step < currentStep
                  ? "bg-[#B3E5FC] text-[#1E498E]"
                  : "bg-[#FFF3E0] text-gray-400"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {step < currentStep ? "✓" : step}
          </motion.div>
          {step < 3 && (
            <div className={`w-20 h-1 mx-2 rounded-full ${step < currentStep ? "bg-[#B3E5FC]" : "bg-[#FFF3E0]"}`} />
          )}
        </div>
      ))}
    </motion.div>
  )

  // Payment Section Component
  const PaymentSection = () => {
    const totalPayment = CONSULTATION_PRICE * selectedTimes.length

    const handlePayment = async () => {
      setProcessingPayment(true)
      setTimeout(() => {
        setProcessingPayment(false)
        setPaymentStep(2)
      }, 2000)
    }

    const confirmPayment = async () => {
      setProcessingPayment(true)
      setTimeout(() => {
        setProcessingPayment(false)
        setPaymentStep(3)
      }, 2000)
    }

    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PaymentSteps currentStep={paymentStep} />

        <AnimatePresence mode="wait">
          {paymentStep === 1 && (
            <motion.div
              key="payment-step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-[#B3E5FC] to-[#FFF3E0] p-6 rounded-2xl">
                <h3 className="font-bold text-[#1E498E] mb-4 text-lg">Detail Pembayaran</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#1E498E]">Konsultasi ({selectedTimes.length}x)</span>
                    <span className="font-semibold text-[#1E498E]">Rp{totalPayment.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t border-[#1E498E]/20 pt-2">
                    <div className="flex justify-between font-bold text-[#1E498E]">
                      <span>Total</span>
                      <span>Rp{totalPayment.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {["BCA", "Gopay"].map((method) => (
                  <motion.button
                    key={method}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPayment(method)}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      selectedPayment === method
                        ? "border-[#1E498E] bg-[#B3E5FC]/30"
                        : "border-[#FFF3E0] bg-white hover:border-[#B3E5FC]"
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#1E498E] rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                        {method.charAt(0)}
                      </div>
                      <span className="font-semibold text-[#1E498E]">{method}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={!selectedPayment || processingPayment}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                  processingPayment || !selectedPayment
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#1E498E] text-white hover:bg-[#1E498E]/90 shadow-lg"
                }`}
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  "Bayar Sekarang"
                )}
              </motion.button>
            </motion.div>
          )}

          {paymentStep === 2 && (
            <motion.div
              key="payment-step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-[#FFF3E0] to-[#B3E5FC] p-6 rounded-2xl">
                <h3 className="font-bold text-[#1E498E] mb-4">Menunggu Pembayaran</h3>
                <p className="text-[#1E498E] mb-4">Silakan transfer ke nomor rekening berikut:</p>
                <div className="bg-white p-4 rounded-xl">
                  <p className="font-mono text-xl font-bold text-[#1E498E]">1234-5678-9012</p>
                  <p className="text-sm text-gray-600">a.n. Klinik Sehat</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmPayment}
                disabled={processingPayment}
                className={`w-full py-4 rounded-2xl font-semibold text-lg ${
                  processingPayment ? "bg-gray-300 text-gray-500" : "bg-[#B3E5FC] text-[#1E498E] hover:bg-[#B3E5FC]/80"
                }`}
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#1E498E] border-t-transparent rounded-full animate-spin" />
                    Mengkonfirmasi...
                  </div>
                ) : (
                  "Konfirmasi Pembayaran"
                )}
              </motion.button>
            </motion.div>
          )}

          {paymentStep === 3 && (
            <motion.div
              key="payment-step-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-[#B3E5FC] rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="text-[#1E498E] text-4xl" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[#1E498E]">Pembayaran Berhasil!</h3>
              <p className="text-gray-600">Jadwal konsultasi Anda telah dikonfirmasi</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedDate(null)
                  setSelectedTimes([])
                  setSelectedPayment(null)
                  setPaymentStep(1)
                  setSelectedDoctor(null)
                }}
                className="w-full py-4 bg-[#1E498E] text-white rounded-2xl font-semibold hover:bg-[#1E498E]/90"
              >
                Selesai
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] relative overflow-hidden">
        <Navbar/>
      {/* Background decorations */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-[#1E498E]/10 rounded-full blur-xl"
        variants={floatingVariants}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-20 right-10 w-48 h-48 bg-[#FFF3E0]/30 rounded-full blur-xl"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1 }}
      />

      <div className="pt-20 pb-10">
        <motion.div className="container mx-auto px-4" variants={containerVariants} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E498E] mb-4">Konsultasi Kesehatan Mental</h1>
            <p className="text-lg text-[#1E498E]/70 max-w-2xl mx-auto">
              Dapatkan bantuan profesional dari psikiater terpercaya untuk kesehatan mental Anda
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Doctor Selection */}
            <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-[#1E498E] mb-6">Pilih Dokter</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {doctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 ${
                      selectedDoctor?.id === doctor.id
                        ? "ring-4 ring-[#1E498E] shadow-2xl"
                        : "shadow-lg hover:shadow-xl"
                    }`}
                  >
                    <div className="bg-gradient-to-br from-white to-[#B3E5FC]/30 p-6 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1E498E]/10">
                          <Image
                            src={doctor.image || "/placeholder.svg"}
                            alt={doctor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#1E498E] text-lg">{doctor.name}</h3>
                          <p className="text-[#1E498E]/70 text-sm">{doctor.specialty}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="text-yellow-400 text-sm fill-current" />
                            <span className="text-sm font-semibold text-[#1E498E]">{doctor.rating}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[#1E498E]/80 text-sm mb-4 line-clamp-3">{doctor.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#1E498E]/60">{doctor.experience}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-[#1E498E] text-white px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          Pilih Dokter
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Promotional Banner */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-[#1E498E] to-[#1E498E]/80 rounded-3xl p-8 text-white relative overflow-hidden"
              >
                <motion.div
                  className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Diskon Spesial!</h3>
                  <p className="text-lg mb-4">Dapatkan diskon 50% untuk konsultasi pertama Anda</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-[#1E498E] px-6 py-3 rounded-full font-semibold"
                  >
                    Klaim Sekarang
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {/* Booking Panel */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl h-fit sticky top-24"
            >
              {/* Doctor Header */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-[#B3E5FC]/30 rounded-2xl">
                <Stethoscope className="text-[#1E498E] text-xl" />
                <div>
                  {selectedDoctor ? (
                    <>
                      <h3 className="font-bold text-[#1E498E]">{selectedDoctor.name}</h3>
                      <p className="text-[#1E498E]/70 text-sm">Jadwal Konsultasi</p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-[#1E498E]">Pilih Dokter</h3>
                      <p className="text-[#1E498E]/70 text-sm">Silakan pilih dokter terlebih dahulu</p>
                    </>
                  )}
                </div>
              </div>

              {selectedDoctor && (
                <>
                  {/* Calendar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-[#1E498E]">
                        {formatDate(currentMonth).month} {currentMonth.getFullYear()}
                      </h4>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigateMonth(-1)}
                          className="p-2 rounded-full bg-[#B3E5FC] text-[#1E498E] hover:bg-[#B3E5FC]/80"
                        >
                          <ChevronLeft />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigateMonth(1)}
                          className="p-2 rounded-full bg-[#B3E5FC] text-[#1E498E] hover:bg-[#B3E5FC]/80"
                        >
                          <ChevronRight />
                        </motion.button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-[#1E498E]/70 py-2">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }, index) => {
                        const isSelected =
                          selectedDate &&
                          date.getDate() === selectedDate.getDate() &&
                          date.getMonth() === selectedDate.getMonth()

                        return (
                          <motion.button
                            key={`date-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.01 }}
                            whileHover={isCurrentMonth ? { scale: 1.1 } : {}}
                            whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
                            onClick={() => isCurrentMonth && setSelectedDate(date)}
                            disabled={!isCurrentMonth}
                            className={`
                              p-2 text-sm rounded-lg transition-all
                              ${
                                isCurrentMonth
                                  ? "hover:bg-[#B3E5FC] text-[#1E498E]"
                                  : "opacity-30 cursor-not-allowed text-gray-400"
                              }
                              ${isSelected ? "bg-[#1E498E] text-white" : ""}
                              ${isToday(date) && !isSelected ? "ring-2 ring-[#1E498E]" : ""}
                            `}
                          >
                            {date.getDate()}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                      <h4 className="font-semibold text-[#1E498E] mb-4">Pilih Waktu:</h4>
                      <div className="space-y-3">
                        {selectedDoctor.schedules.map((slot, index) => {
                          const isBooked = bookedSlots[slot.time]?.isBooked
                          const isSelected = selectedTimes.includes(slot.time)

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-[#FFF3E0]/50 rounded-xl"
                            >
                              <div>
                                <p className="font-medium text-[#1E498E]">{slot.session}</p>
                                <p className="text-sm text-[#1E498E]/70">{slot.time}</p>
                              </div>
                              <motion.button
                                whileHover={!isBooked ? { scale: 1.05 } : {}}
                                whileTap={!isBooked ? { scale: 0.95 } : {}}
                                onClick={() => handleTimeSelection(slot.time)}
                                disabled={isBooked}
                                className={`
                                  px-4 py-2 rounded-full text-sm font-medium transition-all
                                  ${
                                    isBooked
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : isSelected
                                        ? "bg-[#1E498E] text-white"
                                        : "bg-[#B3E5FC] text-[#1E498E] hover:bg-[#B3E5FC]/80"
                                  }
                                `}
                              >
                                {isBooked ? "Terpesan" : isSelected ? "Terpilih" : "Pilih"}
                              </motion.button>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Payment Section */}
                  {selectedDate && selectedTimes.length > 0 ? (
                    <PaymentSection />
                  ) : (
                    <motion.div
                      className="text-center p-6 bg-[#FFF3E0]/50 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Calendar className="text-[#1E498E]/50 text-3xl mx-auto mb-3" />
                      <p className="text-[#1E498E]/70">
                        {!selectedDate ? "Silakan pilih tanggal konsultasi" : "Silakan pilih waktu konsultasi"}
                      </p>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
