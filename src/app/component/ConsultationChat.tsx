"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Stethoscope,
  Play,
  Square
} from 'lucide-react'
import { 
  Consultation, 
  ChatMessage, 
  sendMessage, 
  listenToConsultation, 
  listenToChatMessages,
  startConsultation,
  completeConsultation
} from '@/app/service/consultationService'

interface ConsultationChatProps {
  consultationId: string
  currentUserId: string
  userType: 'user' | 'doctor'
}

export default function ConsultationChat({ 
  consultationId, 
  currentUserId, 
  userType 
}: ConsultationChatProps) {
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!consultationId) return

    console.log('Setting up consultation listener for:', consultationId)
    
    const unsubscribeConsultation = listenToConsultation(consultationId, (updatedConsultation) => {
      console.log('Consultation status updated:', updatedConsultation)
      if (updatedConsultation) {
        setConsultation(updatedConsultation)
        setLoading(false)
      }
    })

    const unsubscribeMessages = listenToChatMessages(consultationId, (messagesData) => {
      setMessages(messagesData)
    })

    return () => {
      unsubscribeConsultation()
      unsubscribeMessages()
    }
  }, [consultationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !consultation) return

    setSending(true)
    
    const result = await sendMessage(
      consultationId,
      currentUserId,
      userType,
      newMessage.trim()
    )

    if (result.success) {
      setNewMessage('')
    } else {
      alert(result.error || 'Failed to send message')
    }

    setSending(false)
  }

  const handleStartConsultation = async () => {
    if (!consultation || userType !== 'doctor') return

    setActionLoading(true)
    const result = await startConsultation(consultationId, currentUserId)
    
    if (!result.success) {
      alert(result.error || 'Failed to start consultation')
      setActionLoading(false)
      return
    }

    setActionLoading(false)
  }

  const handleCompleteConsultation = async () => {
    if (!consultation || userType !== 'doctor') return

    if (!confirm('Are you sure you want to complete this consultation?')) {
      setActionLoading(false)
      return
    }

    setActionLoading(true)
    
    const result = await completeConsultation(consultationId, currentUserId)
    
    if (!result.success) {
      alert(result.error || 'Failed to complete consultation')
    }

    setActionLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-yellow-600 bg-yellow-100'
      case 'started': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'started': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const canSendMessages = consultation?.status === 'started'
  const canStartConsultation = userType === 'doctor' && consultation?.status === 'scheduled'
  const canCompleteConsultation = userType === 'doctor' && consultation?.status === 'started'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E498E]"></div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Consultation not found</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px] flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-6 h-6 text-[#1E498E]" />
            <div>
              <h3 className="font-semibold text-gray-900">{consultation.doctorName}</h3>
              <p className="text-sm text-gray-600">
                {consultation.scheduledDate.toLocaleDateString()} - {consultation.scheduledTime}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(consultation.status)}`}>
              {getStatusIcon(consultation.status)}
              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Doctor Actions */}
        {userType === 'doctor' && (
          <div className="mt-3 flex gap-2">
            {canStartConsultation && (
              <motion.button
                onClick={handleStartConsultation}
                disabled={actionLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Consultation
              </motion.button>
            )}
            
            {canCompleteConsultation && (
              <motion.button
                onClick={handleCompleteConsultation}
                disabled={actionLoading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Complete Consultation
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!canSendMessages && consultation.status === 'scheduled' && (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {userType === 'doctor' ? 'Start the consultation to begin chatting' : 'Waiting for doctor to start consultation'}
            </h3>
            <p className="text-gray-500">
              {userType === 'doctor' 
                ? 'Click "Start Consultation" to begin the session'
                : 'The doctor will start the consultation at the scheduled time'
              }
            </p>
          </div>
        )}

        {consultation.status === 'completed' && messages.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Consultation Completed</h3>
            <p className="text-gray-500">This consultation has been completed.</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.senderType === userType ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.senderType === userType
                  ? 'bg-[#1E498E] text-white'
                  : 'bg-white text-gray-800 shadow-md'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {message.senderType === 'doctor' ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.senderType === 'doctor' ? 'Doctor' : 'You'}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {canSendMessages && (
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E498E] focus:border-transparent"
              disabled={sending}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-[#1E498E] text-white px-4 py-2 rounded-lg hover:bg-[#1E498E]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      {!canSendMessages && consultation.status !== 'scheduled' && consultation.status !== 'completed' && (
        <div className="border-t bg-gray-100 p-4 text-center">
          <p className="text-gray-600 text-sm">Chat is not available for this consultation status</p>
        </div>
      )}
    </div>
  )
}
