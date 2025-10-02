"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Send, Brain, Sparkles, Activity, Eye, Clock, MessageCircle } from "lucide-react"
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

export default function CeritaTenjin() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [scanDuration, setScanDuration] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

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

  // Text-to-Speech function
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
    
    utterance.rate = 0.95
    utterance.pitch = 1.1
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthesisRef.current = utterance
    setTimeout(() => window.speechSynthesis.speak(utterance), 100)
  }

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const messageText = inputMessage.trim()
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
      emotion: currentEmotion?.emotion,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Get AI response asynchronously
    const getResponse = async () => {
      try {
        const aiResponseText = await getAIResponse(messageText, currentEmotion || undefined);
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          sender: "ai",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
        
        // Speak the AI response
        speakText(aiResponseText);
      } catch (error) {
        console.error('Error in AI response:', error);
        setIsTyping(false);
      }
    };

    // Add a delay for better UX
    setTimeout(getResponse, 1000 + Math.random() * 2000);
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
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(d => d.kind === 'videoinput')
      const preferredDeviceId = cameras[0]?.deviceId

      const candidates: MediaStreamConstraints[] = [
        { video: { deviceId: preferredDeviceId ? { exact: preferredDeviceId } : undefined, width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } },
        { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { width: { ideal: 320 }, height: { ideal: 240 } } },
        { video: { facingMode: 'user' } },
        { video: true },
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
  }

  // Update scan duration
  useEffect(() => {
    if (!isDetecting) return

    const durationInterval = setInterval(() => {
      setScanDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(durationInterval)
  }, [isDetecting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      window.speechSynthesis.cancel()
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
            {/* Left Column - Camera */}
            <div className="hidden lg:block lg:col-span-1">
              <motion.div variants={itemVariants}>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden sticky top-24">
                  <div className="p-3 border-b border-gray-200/50 bg-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <h3 className="text-[#1E498E] font-semibold text-sm flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          Camera
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
                            <Eye className="w-12 h-12 mx-auto mb-2 opacity-40" />
                            <p className="text-sm mb-1">Kamera tidak aktif</p>
                            {!isModelLoaded && (
                              <div className="mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/50 mx-auto mb-1"></div>
                                <p className="text-xs">Memuat model...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Emotion Status Card */}
              <motion.div variants={itemVariants} className="mt-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden p-4">
                  <AnimatePresence mode="wait">
                    {currentEmotion ? (
                      <motion.div
                        key={currentEmotion.emotion}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-12 h-12 ${currentEmotion.color} rounded-full flex items-center justify-center text-white text-2xl shadow-lg`}>
                          {currentEmotion.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[#1E498E] text-base truncate">{currentEmotion.emotion}</span>
                            <span className="text-sm text-[#1E498E]/70 font-semibold">{Math.round(currentEmotion.confidence * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
                        className="flex items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl">
                          😐
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-400 text-base">Menunggu deteksi...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Center Column - TenJin & Chat */}
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

                {/* Text Input */}
                <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-md px-4">
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ceritakan perasaan Anda..."
                      className="flex-1 px-4 py-3 border-2 border-[#1E498E]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E498E] focus:border-transparent text-[#1E498E] bg-white/90 backdrop-blur-sm placeholder-[#1E498E]/50 font-medium"
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      whileHover={{ scale: inputMessage.trim() ? 1.05 : 1 }}
                      whileTap={{ scale: inputMessage.trim() ? 0.95 : 1 }}
                      className={`p-3 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                        !inputMessage.trim() || isTyping
                          ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-[#1E498E] text-white hover:bg-[#1E498E]/90"
                      }`}
                    >
                      <Send className="w-6 h-6" />
                    </motion.button>
                  </div>
                  
                  <p className="text-[#1E498E]/70 text-sm text-center">
                    💬 Ketik pesan Anda dan tekan Enter atau tombol kirim
                  </p>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3 mt-4">
                  {!isDetecting ? (
                    <motion.button
                      onClick={startCamera}
                      disabled={!isModelLoaded}
                      whileHover={{ scale: isModelLoaded ? 1.05 : 1 }}
                      whileTap={{ scale: isModelLoaded ? 0.95 : 1 }}
                      className={`px-8 py-4 rounded-2xl font-semibold flex items-center gap-2 transition-colors shadow-lg ${
                        isModelLoaded 
                          ? "bg-[#1E498E] hover:bg-[#1E498E]/90 text-white" 
                          : "bg-gray-400 text-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {isModelLoaded ? <Eye className="w-5 h-5" /> : <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                      {isModelLoaded ? "Mulai Scan" : "Memuat Model..."}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={stopCamera}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-2 transition-colors shadow-lg"
                    >
                      <Eye className="w-5 h-5" />
                      Stop Scan
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Chat History & Analysis */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
              {/* Chat History */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 bg-white/50">
                  <h3 className="text-[#1E498E] font-semibold text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Riwayat Percakapan
                  </h3>
                </div>

                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-[#1E498E]/50 py-12">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h4 className="text-base font-medium mb-2">Belum ada percakapan</h4>
                      <p className="text-sm">Mulai ceritakan perasaan Anda!</p>
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
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.emotion && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
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

              {/* Analysis */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4">
                <h3 className="text-[#1E498E] font-semibold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Analisis Real-time
                </h3>

                {isDetecting && (
                  <div className="mb-3 p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#1E498E]/70">Deteksi Wajah:</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="text-xs text-[#1E498E] font-medium">
                          {faceDetected ? 'Terdeteksi' : 'Mencari...'}
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
                      className={`bg-gradient-to-r ${currentEmotion.bgGradient || 'from-gray-100/50 to-gray-200/50'} p-3 rounded-xl border-l-4 ${currentEmotion.color || 'border-gray-400'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{currentEmotion.icon}</span>
                        <div>
                          <h4 className="font-bold text-[#1E498E] text-sm">{currentEmotion.emotion}</h4>
                          <p className="text-xs text-[#1E498E]/70">Kepercayaan: {Math.round(currentEmotion.confidence * 100)}%</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-6 text-[#1E498E]/50">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Menunggu analisis...</p>
                    </div>
                  )}
                </AnimatePresence>

                {/* Emotion History */}
                {emotionHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-[#1E498E] mb-2">Riwayat Emosi</h4>
                    <div className="space-y-1.5">
                      {emotionHistory.slice(-5).reverse().map((emotion, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{emotion.icon}</span>
                            <span className="text-xs text-[#1E498E]">{emotion.emotion}</span>
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
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4">
                  <h3 className="text-[#1E498E] font-semibold text-lg mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Kesehatan Mental
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#1E498E]">Tingkat Risiko</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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
                    </div>

                    <div className="space-y-2">
                      {['depressionScore', 'anxietyScore', 'stressLevel'].map((key, idx) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-xs text-[#1E498E]">
                            {key === 'depressionScore' ? 'Depresi' : key === 'anxietyScore' ? 'Kecemasan' : 'Stres'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${mentalHealthAssessment.indicators[key as keyof typeof mentalHealthAssessment.indicators]}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#1E498E]/70 w-6">
                              {Math.round(mentalHealthAssessment.indicators[key as keyof typeof mentalHealthAssessment.indicators])}
                            </span>
                          </div>
                        </div>
                      ))}
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
