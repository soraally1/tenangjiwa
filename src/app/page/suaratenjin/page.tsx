"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Pause, Brain, Sparkles, Activity, Eye, Clock } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Navbar from "../../component/navbar"
import { useMentalHealthDetection } from "@/app/hooks/useMentalHealthDetection"
import { groqService, type ChatContext } from "@/app/service/groqService"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
  emotion?: string
}

export default function SuaraTenjin() {
  const [isRecording, setIsRecording] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [audioTranscript, setAudioTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [scanDuration, setScanDuration] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const processingTimeoutRef = useRef<number | null>(null)
  const silenceTimeoutRef = useRef<number | null>(null)

  // Use mental health detection hook
  const {
    isModelLoaded,
    faceDetected,
    currentEmotion,
    emotionHistory,
    isDetecting,
    mentalHealthAssessment,
    startDetection,
    stopDetection,
    canvasRef
  } = useMentalHealthDetection()

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
        ease: "easeOut" as const,
      },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  }

  // AI Response Generator using Groq
  const getAIResponse = async (userMessage: string, emotion?: { emotion: string; confidence: number }): Promise<string> => {
    try {
      // Build context for Groq AI
      const context: ChatContext = {
        emotionContext: emotion ? {
          emotion: emotion.emotion,
          confidence: emotion.confidence
        } : undefined,
        mentalHealthContext: mentalHealthAssessment ? {
          overallRisk: mentalHealthAssessment.overallRisk,
          indicators: mentalHealthAssessment.indicators
        } : undefined
      };

      // Get AI response from Groq
      const response = await groqService.generateResponse(userMessage, context);
      return response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to simple responses if Groq fails
      const fallbackResponses = [
        "Terima kasih sudah berbagi dengan saya. Bagaimana perasaan Anda sekarang?",
        "Saya mendengarkan dengan seksama. Ada lagi yang ingin Anda ceritakan?",
        "Saya memahami perasaan Anda. Mari kita bicarakan lebih lanjut.",
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  // Optimized Text-to-Speech with conversation flow
  const speakText = (text: string) => {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    
    const indonesianVoice = voices.find(voice => 
      voice.lang.includes('id-ID') || voice.lang.includes('id')
    )
    const englishVoice = voices.find(voice => 
      voice.lang.includes('en-US') || voice.lang.includes('en')
    )
    
    if (indonesianVoice) {
      utterance.voice = indonesianVoice
      utterance.lang = 'id-ID'
    } else if (englishVoice) {
      utterance.voice = englishVoice
      utterance.lang = 'en-US'
    } else {
      utterance.lang = 'id-ID'
    }
    
    // Faster speech for more responsive conversation
    utterance.rate = 1.1
    utterance.pitch = 1.1
    utterance.volume = 1.0

    utterance.onstart = () => {
      setIsSpeaking(true)
      setConversationState('speaking')
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setConversationState('idle')
      
      // Auto-restart listening after AI finishes speaking
      setTimeout(() => {
        if (!isRecording && !isProcessing) {
          startVoiceRecording()
        }
      }, 500)
    }

    utterance.onerror = (event) => {
      setIsSpeaking(false)
      setConversationState('idle')
      console.error('Speech synthesis error:', event)
    }

    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('Available voices:', voices.length)
    }
    
    // Voices might not be loaded immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Send message with optimized processing
  const sendMessage = async (transcript?: string) => {
    const messageText = (transcript || audioTranscript).trim()
    if (!messageText) return

    // Clear transcripts immediately
    setAudioTranscript("")
    setInterimTranscript("")
    finalTranscriptRef.current = ''
    setConversationState('processing')
    setIsProcessing(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
      emotion: currentEmotion?.emotion,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Get AI response with minimal delay
      const aiResponseText = await getAIResponse(messageText, currentEmotion || undefined);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
      setIsProcessing(false);
      setConversationState('speaking');
      
      // Speak the AI response immediately
      speakText(aiResponseText);
    } catch (error) {
      console.error('Error in AI response:', error);
      setIsTyping(false);
      setIsProcessing(false);
      setConversationState('idle');
    }
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isTyping])

  // Start camera and detection
  const startCamera = async () => {
    if (!isModelLoaded) {
      alert("Model AI sedang dimuat, silakan tunggu sebentar...")
      return
    }

    try {
      // Stop any previous stream
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }

      // Enumerate cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(d => d.kind === 'videoinput')
      const preferredDeviceId = cameras[0]?.deviceId

      // Build retry candidates
      const candidates: MediaStreamConstraints[] = [
        { video: { deviceId: preferredDeviceId ? { exact: preferredDeviceId } : undefined, width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: true },
        { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: true },
        { video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: true },
        { video: { facingMode: 'user' }, audio: true },
        { video: true, audio: true },
      ]

      const getUserMediaWithTimeout = (constraints: MediaStreamConstraints, timeoutMs = 7000) =>
        new Promise<MediaStream>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('getUserMedia timeout')), timeoutMs)
          navigator.mediaDevices.getUserMedia(constraints)
            .then(s => { clearTimeout(timer); resolve(s) })
            .catch(e => { clearTimeout(timer); reject(e) })
        })

      let stream: MediaStream | null = null
      let lastErr: unknown = null
      for (const c of candidates) {
        try {
          stream = await getUserMediaWithTimeout(c)
          break
        } catch (e) {
          lastErr = e
        }
      }

      if (!stream) throw lastErr ?? new Error('Unable to start camera')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        mediaStreamRef.current = stream
        setScanDuration(0)
        await startDetection(videoRef.current)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Gagal mengakses kamera. Pastikan izin diberikan, tidak dipakai aplikasi lain, dan coba lagi.')
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    stopDetection()
    stopVoiceRecording()
  }

  // Optimized voice recording with auto face scan
  const startVoiceRecording = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser Anda tidak mendukung pengenalan suara. Gunakan Chrome atau Edge.')
      return
    }

    // Auto-start camera and face detection when starting voice
    if (!isDetecting && isModelLoaded) {
      try {
        await startCamera()
      } catch (error) {
        console.log('Camera failed to start, continuing with voice only:', error)
      }
    }

    // Stop any ongoing speech synthesis
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setConversationState('listening')

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // Optimized settings for faster response
      recognition.lang = 'id-ID'
      recognition.continuous = false // Changed to false for faster processing
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('🎤 Voice recognition started')
        setIsRecording(true)
        finalTranscriptRef.current = ''
        setAudioTranscript('')
        setInterimTranscript('')
        
        // Clear any existing timeouts
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current)
        }
      }

      recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let finalText = ''
        let interimText = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim()
          if (event.results[i].isFinal) {
            finalText += transcript + ' '
            finalTranscriptRef.current += transcript + ' '
          } else {
            interimText += transcript
          }
        }
        
        // Update transcripts in real-time
        if (finalText) {
          setAudioTranscript(finalTranscriptRef.current.trim())
          setInterimTranscript('')
          
          // Auto-process after getting final result
          if (processingTimeoutRef.current) {
            window.clearTimeout(processingTimeoutRef.current)
          }
          processingTimeoutRef.current = window.setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              stopVoiceRecording()
              sendMessage(finalTranscriptRef.current.trim())
            }
          }, 800) // Reduced delay for faster response
        } else if (interimText) {
          setInterimTranscript(interimText)
        }
        
        // Reset silence timeout
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current)
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (finalTranscriptRef.current.trim()) {
            stopVoiceRecording()
            sendMessage(finalTranscriptRef.current.trim())
          }
        }, 2000) // Auto-stop after 2 seconds of silence
      }

      recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('❌ Speech recognition error:', event.error)
        setIsRecording(false)
        setConversationState('idle')
        
        if (event.error === 'not-allowed') {
          alert('Izin mikrofon ditolak. Silakan izinkan akses mikrofon di browser Anda.')
        } else if (event.error === 'no-speech') {
          // Restart recognition for continuous listening
          setTimeout(() => {
            if (!isProcessing && !isSpeaking) {
              startVoiceRecording()
            }
          }, 500)
        } else if (event.error === 'network') {
          alert('Koneksi internet bermasalah. Pastikan Anda terhubung ke internet.')
        }
      }

      recognition.onend = () => {
        console.log('🔇 Voice recognition ended')
        setIsRecording(false)
        
        // Process any remaining transcript
        if (finalTranscriptRef.current.trim() && !isProcessing) {
          sendMessage(finalTranscriptRef.current.trim())
        } else if (!isProcessing && !isSpeaking) {
          setConversationState('idle')
        }
      }

      recognition.start()
      recognitionRef.current = recognition
      
    } catch (error) {
      console.error('Failed to start recognition:', error)
      alert('Gagal memulai pengenalan suara. Pastikan Anda menggunakan browser yang mendukung (Chrome/Edge).')
      setIsRecording(false)
      setConversationState('idle')
    }
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    
    // Clear all timeouts
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isSpeaking) {
      // Stop AI speaking and start listening
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setConversationState('idle')
      return
    }
    
    if (isRecording || isProcessing) {
      stopVoiceRecording()
      setConversationState('idle')
    } else {
      startVoiceRecording()
    }
  }

  // Update scan duration
  useEffect(() => {
    if (!isDetecting) return

    const durationInterval = setInterval(() => {
      setScanDuration(prev => prev + 1)
    }, 1000)

    return () => {
      clearInterval(durationInterval)
    }
  }, [isDetecting])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      window.speechSynthesis.cancel()
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current)
      }
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] relative overflow-hidden">
      <Navbar />

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
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#B3E5FC]/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 2 }}
      />

      <div className="pt-20 pb-10">
        <motion.div 
          className="container mx-auto px-4 max-w-7xl" 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
        >

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Camera (Now visible on mobile too) */}
            <div className="lg:col-span-1">
              <motion.div variants={itemVariants}>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden sticky top-24">
                  <div className="p-3 border-b border-gray-200/50 bg-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          isDetecting ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                        <h3 className="text-[#1E498E] font-semibold text-sm flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          Deteksi Emosi
                        </h3>
                      </div>
                      {isDetecting && (
                        <div className="flex items-center gap-1.5 text-[#1E498E]/70">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-mono">{Math.floor(scanDuration / 60)}:{(scanDuration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 10 }}
                      />

                      {/* Scanning Animation */}
                      <AnimatePresence>
                        {isDetecting && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                          >
                            <div className="absolute inset-0 border-2 border-green-400/40 rounded-xl">
                              <motion.div
                                animate={{
                                  y: [0, "100%", 0],
                                  transition: { duration: 2, repeat: Infinity },
                                }}
                                className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                              />
                            </div>

                            {/* Corner indicators */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-400"></div>
                            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-400"></div>
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-400"></div>
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-400"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* No camera placeholder */}
                      {!isDetecting && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white/60">
                            <Eye className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 opacity-40" />
                            <p className="text-xs md:text-sm mb-1">Deteksi emosi tidak aktif</p>
                            {!isModelLoaded ? (
                              <div className="mt-2">
                                <div className="animate-spin rounded-full h-4 w-4 md:h-6 md:w-6 border-b-2 border-white/50 mx-auto mb-1"></div>
                                <p className="text-xs">Memuat model AI...</p>
                              </div>
                            ) : (
                              <p className="text-xs text-white/40">Mulai berbicara untuk mengaktifkan</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Emotion Status Card - Compact for mobile */}
              <motion.div variants={itemVariants} className="mt-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden p-3 md:p-4">
                  <AnimatePresence mode="wait">
                    {currentEmotion ? (
                      <motion.div
                        key={currentEmotion.emotion}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 md:gap-3"
                      >
                        <div className={`w-8 h-8 md:w-12 md:h-12 ${currentEmotion.color} rounded-full flex items-center justify-center text-white text-lg md:text-2xl shadow-lg`}>
                          {currentEmotion.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[#1E498E] text-sm md:text-base truncate">{currentEmotion.emotion}</span>
                            <span className="text-xs md:text-sm text-[#1E498E]/70 font-semibold">{Math.round(currentEmotion.confidence * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${currentEmotion.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${currentEmotion.confidence * 100}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 md:gap-3"
                      >
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-lg md:text-2xl">
                          😐
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-400 text-sm md:text-base">Menunggu deteksi...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Center Column - TenJin Mascot & Voice Interface */}
            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 py-8">
                {/* TenJin Mascot */}
                <motion.div
                  className="relative"
                  animate={isSpeaking ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.5, repeat: Infinity }
                  } : {}}
                >
                  <div className="w-56 h-56 md:w-64 md:h-64 relative">
                    <Image 
                      src="/Tenjin.svg" 
                      alt="TenJin" 
                      width={256}
                      height={256}
                      className="w-full h-full object-contain drop-shadow-2xl" 
                    />
                  </div>
                  
                  {/* Emotion Badge */}
                  {currentEmotion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <div className={`${currentEmotion.color} text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5`}>
                        <span className="text-xl">{currentEmotion.icon}</span>
                        <span className="font-semibold text-sm">{currentEmotion.emotion}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Speaking Indicator */}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex space-x-1.5">
                      {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-10 bg-[#1E498E] rounded-full"
                          animate={{ height: [40, 16, 40] }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Latest Message Display */}
                {chatMessages.length > 0 && !isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full px-4"
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-white/50">
                      <p className="text-[#1E498E] text-center leading-relaxed text-base">
                        {chatMessages[chatMessages.length - 1].text}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Microphone Button */}
                <div className="flex flex-col items-center gap-3 mt-4 relative z-50">
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleRecording()
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer ${
                      conversationState === 'listening'
                        ? "bg-red-500 text-white"
                        : conversationState === 'processing'
                        ? "bg-orange-500 text-white"
                        : conversationState === 'speaking'
                        ? "bg-green-500 text-white"
                        : "bg-[#1E498E] text-white hover:bg-[#1E498E]/90"
                    }`}
                    style={{ pointerEvents: 'auto' }}
                    animate={
                      conversationState === 'listening' ? {
                        scale: [1, 1.08, 1],
                        transition: { duration: 1.5, repeat: Infinity }
                      } : conversationState === 'processing' ? {
                        rotate: [0, 360],
                        transition: { duration: 2, repeat: Infinity, ease: "linear" }
                      } : conversationState === 'speaking' ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 0.8, repeat: Infinity }
                      } : {}
                    }
                  >
                    {conversationState === 'listening' ? (
                      <MicOff className="w-14 h-14 md:w-16 md:h-16" />
                    ) : conversationState === 'processing' ? (
                      <Brain className="w-14 h-14 md:w-16 md:h-16" />
                    ) : conversationState === 'speaking' ? (
                      <Pause className="w-14 h-14 md:w-16 md:h-16" />
                    ) : (
                      <Mic className="w-14 h-14 md:w-16 md:h-16" />
                    )}
                  </motion.button>
                  
                  <div className="text-center px-4">
                    {/* Dynamic Status Display */}
                    <motion.p 
                      key={conversationState}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[#1E498E] font-semibold text-base md:text-lg"
                    >
                      {conversationState === 'listening' && "🎤 Mendengarkan..."}
                      {conversationState === 'processing' && "🧠 Memproses..."}
                      {conversationState === 'speaking' && "🗣️ TenJin berbicara..."}
                      {conversationState === 'idle' && (isSpeaking ? "Tekan untuk menghentikan" : "Tekan untuk berbicara")}
                    </motion.p>
                    
                    {/* Real-time Transcript Display */}
                    <AnimatePresence>
                      {(audioTranscript || interimTranscript) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 max-w-md"
                        >
                          {audioTranscript && (
                            <p className="text-[#1E498E] font-medium text-sm mb-2">
                              📝 Final: &quot;{audioTranscript}&quot;
                            </p>
                          )}
                          {interimTranscript && (
                            <p className="text-[#1E498E]/60 text-sm italic">
                              ⏳ Mendengar: &quot;{interimTranscript}&quot;
                            </p>
                          )}
                          
                          {/* Processing Indicator */}
                          {isProcessing && (
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E498E]"></div>
                              <span className="text-[#1E498E]/70 text-xs">Mengirim ke AI...</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Quick Action Hints */}
                    <motion.div 
                      className="mt-3 text-xs text-[#1E498E]/60 space-y-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {conversationState === 'idle' && (
                        <p>💡 Bicara dengan natural, TenJin akan merespons otomatis</p>
                      )}
                      {conversationState === 'listening' && (
                        <p>⚡ Berhenti bicara sejenak untuk memproses</p>
                      )}
                      {conversationState === 'speaking' && (
                        <p>👂 Tekan tombol untuk menghentikan dan mulai berbicara</p>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Auto-Detection Status */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${
                      isDetecting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs md:text-sm text-[#1E498E] font-medium">
                      {isDetecting ? 'Deteksi Aktif' : 'Deteksi Otomatis'}
                    </span>
                  </div>
                  <p className="text-xs text-[#1E498E]/60 text-center px-2">
                    {isModelLoaded 
                      ? 'Deteksi emosi akan aktif otomatis saat Anda berbicara'
                      : 'Memuat model AI untuk deteksi emosi...'
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Chat History & Analysis */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4 md:space-y-6">
              {/* Chat History */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 bg-white/50">
                  <h3 className="text-[#1E498E] font-semibold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Riwayat Percakapan Suara
                  </h3>
                </div>

                <div className="h-48 md:h-64 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-[#1E498E]/50 py-6 md:py-8">
                      <Mic className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                      <h4 className="text-sm md:text-base font-medium mb-1 md:mb-2">Belum ada percakapan</h4>
                      <p className="text-xs md:text-sm">Mulai berbicara dengan TenJin!</p>
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow ${message.sender === "user"
                        ? "bg-[#1E498E] text-white"
                        : "bg-white text-[#1E498E]"
                        }`}>
                        <p className="text-xs md:text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.emotion && (
                            <span className="text-xs bg-white/20 px-1.5 md:px-2 py-0.5 rounded-full">
                              {message.emotion}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white text-[#1E498E] px-4 py-2 rounded-2xl shadow">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#1E498E] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#1E498E] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-[#1E498E] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Current Analysis */}
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Analisis Real-time
                </h3>

                {/* Face Detection Status */}
                {isDetecting && (
                  <div className="mb-4 p-3 bg-white/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#1E498E]/70">Deteksi Wajah:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="text-xs text-[#1E498E] font-medium">
                          {faceDetected ? 'Wajah Terdeteksi' : 'Mencari Wajah...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {currentEmotion ? (
                    <motion.div
                      key={currentEmotion.emotion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`bg-gradient-to-r ${currentEmotion.bgGradient || 'from-gray-100/50 to-gray-200/50'} p-4 rounded-xl border-l-4 ${currentEmotion.color || 'border-gray-400'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{currentEmotion.icon}</span>
                        <div>
                          <h4 className="font-bold text-[#1E498E]">{currentEmotion.emotion}</h4>
                          <p className="text-xs text-[#1E498E]/70">Kepercayaan: {Math.round(currentEmotion.confidence * 100)}%</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-[#1E498E]/50">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Menunggu analisis...</p>
                      <p className="text-sm">Mulai scan untuk melihat hasil</p>
                    </div>
                  )}
                </AnimatePresence>

                {/* Emotion History */}
                {emotionHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[#1E498E] mb-3">Riwayat Emosi</h4>
                    <div className="space-y-2">
                      {emotionHistory.slice(-5).reverse().map((emotion, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{emotion.icon}</span>
                            <span className="text-sm text-[#1E498E]">{emotion.emotion}</span>
                          </div>
                          <span className="text-xs text-[#1E498E]/70">{Math.round(emotion.confidence * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mental Health Assessment */}
              {mentalHealthAssessment && (
                <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
                  <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                    <Brain className="w-6 h-6" />
                    Analisis Kesehatan Mental
                  </h3>

                  <div className="space-y-4">
                    {/* Risk Level */}
                    <div className="p-4 bg-white/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#1E498E]">Tingkat Risiko</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          mentalHealthAssessment.overallRisk === 'critical' ? 'bg-red-100 text-red-800' :
                          mentalHealthAssessment.overallRisk === 'high' ? 'bg-orange-100 text-orange-800' :
                          mentalHealthAssessment.overallRisk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {mentalHealthAssessment.overallRisk === 'critical' ? 'KRITIS' :
                           mentalHealthAssessment.overallRisk === 'high' ? 'TINGGI' :
                           mentalHealthAssessment.overallRisk === 'moderate' ? 'SEDANG' : 'RENDAH'}
                        </span>
                      </div>
                      <div className="text-xs text-[#1E498E]/70">
                        Confidence: {Math.round(mentalHealthAssessment.confidence * 100)}%
                      </div>
                    </div>

                    {/* Mental Health Scores */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1E498E]">Depresi</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-red-500 rounded-full transition-all duration-500"
                              style={{ width: `${mentalHealthAssessment.indicators.depressionScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#1E498E]/70 w-8">
                            {Math.round(mentalHealthAssessment.indicators.depressionScore)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1E498E]">Kecemasan</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${mentalHealthAssessment.indicators.anxietyScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#1E498E]/70 w-8">
                            {Math.round(mentalHealthAssessment.indicators.anxietyScore)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1E498E]">Stres</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-yellow-500 rounded-full transition-all duration-500"
                              style={{ width: `${mentalHealthAssessment.indicators.stressLevel}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#1E498E]/70 w-8">
                            {Math.round(mentalHealthAssessment.indicators.stressLevel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
