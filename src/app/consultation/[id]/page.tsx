"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, MessageCircle } from 'lucide-react'
import Navbar from '@/app/component/navbar'
import ConsultationChat from '@/app/component/ConsultationChat'
import { getCurrentUserAsync } from '@/app/service/loginservice'
import { getConsultation, type Consultation } from '@/app/service/consultationService'

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const consultationId = params.id as string
  
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'user' | 'doctor'>('user')

  useEffect(() => {
    const initializeConsultation = async () => {
      try {
        // Get current user
        const user = await getCurrentUserAsync()
        if (!user) {
          router.push('/login')
          return
        }
        
        setCurrentUser(user)
        
        // Get consultation details
        const consultationData = await getConsultation(consultationId)
        if (!consultationData) {
          setLoading(false)
          return
        }
        
        setConsultation(consultationData)
        
        // Determine user type
        if (consultationData.doctorId === user.uid) {
          setUserType('doctor')
        } else if (consultationData.userId === user.uid) {
          setUserType('user')
        } else {
          // User is not part of this consultation
          router.push('/konsultasi')
          return
        }
        
      } catch (error) {
        console.error('Error initializing consultation:', error)
      } finally {
        setLoading(false)
      }
    }

    if (consultationId) {
      initializeConsultation()
    }
  }, [consultationId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E498E]"></div>
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Consultation not found</h3>
              <p className="text-gray-500 mb-4">The consultation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
              <motion.button
                onClick={() => router.push('/konsultasi')}
                className="bg-[#1E498E] text-white px-6 py-2 rounded-lg hover:bg-[#1E498E]/90"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Consultations
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            onClick={() => router.push('/konsultasi')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E498E] rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userType === 'doctor' ? 'Doctor Console' : 'Consultation Chat'}
              </h1>
              <p className="text-gray-600">
                {userType === 'doctor' 
                  ? `Managing consultation with patient`
                  : `Consultation with ${consultation.doctorName}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <ConsultationChat
            consultationId={consultationId}
            currentUserId={currentUser?.uid || ''}
            userType={userType}
          />
        </motion.div>
      </div>
    </div>
  )
}
