'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useMentalHealthDetection } from '@/app/hooks/useMentalHealthDetection';
import { Camera, TrendingUp, Clock, Eye, Activity, Brain, Play, Pause, Smile, Frown, Meh, Zap, Mic, MicOff, Video, VideoOff, Sparkles } from 'lucide-react';

export default function SuaraTenjinPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanDuration, setScanDuration] = useState(0);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use mental health detection hook
  const {
    isModelLoaded,
    faceDetected,
    currentEmotion,
    emotionHistory,
    isDetecting,
    startDetection,
    stopDetection,
    canvasRef
  } = useMentalHealthDetection();

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update scan duration when detecting
  useEffect(() => {
    if (!isDetecting) return;

    const durationInterval = setInterval(() => {
      setScanDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(durationInterval);
    };
  }, [isDetecting]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      if (transcript.trim()) {
        handleSendMessage(transcript);
        setTranscript('');
      }
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, userMessage]);

    // Generate AI response based on emotion
    setTimeout(() => {
      let responseText = 'Terima kasih sudah berbagi dengan saya. Saya mendengarkan kamu dengan penuh perhatian.';

      if (currentEmotion) {
        const emotionResponses: Record<string, string> = {
          'Sedih': 'Saya melihat kesedihan di mata kamu. Saya di sini untuk mendengarkan. Ceritakan lebih lanjut.',
          'Bahagia': 'Senang melihat kamu bahagia! Energi positif kamu sangat menular.',
          'Marah': 'Saya mendeteksi kemarahan. Mari kita bicarakan apa yang membuat kamu marah.',
          'Takut': 'Saya melihat ketakutan. Saya di sini untuk membantu kamu merasa aman.',
          'Netral': 'Kamu terlihat tenang. Ada yang ingin kamu ceritakan?'
        };
        responseText = emotionResponses[currentEmotion.emotion] || responseText;
      }

      const aiResponse = {
        role: 'assistant' as const,
        content: responseText
      };
      setMessages(prev => [...prev, aiResponse]);
      speakText(aiResponse.content);
    }, 1000);
  };

  const startCamera = async () => {
    if (!isModelLoaded) {
      alert('Model AI sedang dimuat, silakan tunggu sebentar...');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanDuration(0);
        await startDetection(videoRef.current);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    stopDetection();
    setShowCamera(false);
  };

  // Helper function to get emotion icon
  const getEmotionIcon = (emotion: string) => {
    const iconMap = {
      'Bahagia': <Smile className="w-5 h-5" />,
      'Sedih': <Frown className="w-5 h-5" />,
      'Marah': <Zap className="w-5 h-5" />,
      'Takut': <Frown className="w-5 h-5" />,
      'Jijik': <Meh className="w-5 h-5" />,
      'Terkejut': <Meh className="w-5 h-5" />,
      'Netral': <Meh className="w-5 h-5" />,
    };
    return iconMap[emotion as keyof typeof iconMap] || <Meh className="w-5 h-5" />;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-white/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Link href="/page/home">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/80 backdrop-blur-sm text-[#1E498E] px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors shadow-lg"
              >
                ← Kembali
              </motion.button>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1E498E] mb-2">Cerita Suara dengan TenJin</h1>
            <p className="text-[#1E498E]/70">Berbicara dengan bebas, TenJin siap mendengarkan kamu 🎤</p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - TenJin Character */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* TenJin Character Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8"
            >
              <div className="flex flex-col items-center gap-6">
                {/* TenJin Avatar */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <Image src="/Tenjin.png" alt="TenJin" width={200} height={200} className="rounded-full" />
                  {isSpeaking && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#1E498E]"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Status */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#1E498E] mb-2">TenJin</h3>
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-green-500 rounded-full"
                    />
                    <span className="text-sm text-[#1E498E]/70">
                      {isListening ? 'Sedang Mendengarkan...' : isSpeaking ? 'Sedang Berbicara...' : 'Online'}
                    </span>
                  </div>
                </div>


                {/* Speaking Indicator */}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-[#1E498E]/10 px-4 py-2 rounded-full"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-3 h-3 bg-[#1E498E] rounded-full"
                    />
                    <span className="text-[#1E498E] font-medium">TenJin sedang berbicara...</span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Transcript Display */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg"
              >
                <p className="text-sm text-[#1E498E]/70 mb-1 font-semibold">Transkripsi Real-time:</p>
                <p className="text-[#1E498E]">{transcript}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Camera Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 lg:col-span-1 space-y-6"
          >
            {/* Camera Feed */}
            {showCamera ? (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#1E498E] font-semibold text-xl flex items-center gap-3">
                      <Eye className="w-6 h-6" />
                      Live Camera Feed
                    </h3>
                    {isDetecting && (
                      <div className="flex items-center gap-2 text-[#1E498E]/70">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{Math.floor(scanDuration / 60)}:{(scanDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl overflow-hidden shadow-inner">
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
                          <div className="absolute inset-0 border-2 border-green-400/50 rounded-2xl">
                            <motion.div
                              animate={{
                                y: [0, "100%", 0],
                                transition: { duration: 2, repeat: Infinity },
                              }}
                              className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-lg shadow-green-400/50"
                            />
                          </div>

                          {/* Corner indicators */}
                          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-green-400"></div>
                          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-green-400"></div>
                          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-green-400"></div>
                          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-green-400"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Emotion Display */}
                    <AnimatePresence>
                      {currentEmotion && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          className="absolute top-6 left-6 right-6"
                        >
                          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 ${currentEmotion.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                                  {getEmotionIcon(currentEmotion.emotion)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#1E498E]">{currentEmotion.emotion}</h4>
                                  <p className="text-[#1E498E]/70 text-sm">Confidence: {Math.round(currentEmotion.confidence * 100)}%</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full ${currentEmotion.color}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentEmotion.confidence * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* No camera placeholder */}
                    {!isDetecting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white/70">
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg mb-2">Kamera tidak aktif</p>
                          <p className="text-sm">Klik tombol di bawah untuk memulai</p>
                          {!isModelLoaded && (
                            <div className="mt-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
                              <p className="text-xs">Memuat model AI...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    {!isDetecting ? (
                      <motion.button
                        onClick={startCamera}
                        disabled={!isModelLoaded}
                        whileHover={{ scale: isModelLoaded ? 1.05 : 1 }}
                        whileTap={{ scale: isModelLoaded ? 0.95 : 1 }}
                        className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg ${isModelLoaded
                            ? "bg-[#1E498E] hover:bg-[#1E498E]/90 text-white"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                          }`}
                      >
                        {isModelLoaded ? <Play className="w-5 h-5" /> : <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                        {isModelLoaded ? "Mulai Scan" : "Memuat Model..."}
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={stopCamera}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg"
                      >
                        <Pause className="w-5 h-5" />
                        Stop Scan
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <VideoOff className="w-16 h-16 text-[#1E498E]/50 mb-4" />
                  <h3 className="text-lg font-semibold text-[#1E498E] mb-2">Kamera Tidak Aktif</h3>
                  <p className="text-sm text-[#1E498E]/70 mb-4">Aktifkan kamera untuk analisis emosi real-time</p>
                  {/* Control Buttons - Google Meet Style */}
                  <div className="flex items-center gap-4">
                    {/* Mic Toggle Button */}
                    <motion.button
                      onClick={toggleListening}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${isListening
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-[#1E498E] hover:bg-[#1E498E]/90'
                        }`}
                    >
                      {isListening && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-red-500/30"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-center h-full">
                        {isListening ? (
                          <Mic className="w-6 h-6 text-white" />
                        ) : (
                          <MicOff className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </motion.button>

                    {/* Camera Toggle Button */}
                    <motion.button
                      onClick={showCamera ? stopCamera : startCamera}
                      disabled={!isModelLoaded}
                      whileHover={{ scale: isModelLoaded ? 1.05 : 1 }}
                      whileTap={{ scale: isModelLoaded ? 0.95 : 1 }}
                      className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${!isModelLoaded
                          ? 'bg-gray-400 cursor-not-allowed'
                          : showCamera
                            ? 'bg-[#1E498E] hover:bg-[#1E498E]/90'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                      <div className="relative z-10 flex items-center justify-center h-full">
                        {!isModelLoaded ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : showCamera ? (
                          <Video className="w-6 h-6 text-white" />
                        ) : (
                          <VideoOff className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </motion.button>

                  </div>
                  {/* Status Text */}
                  <div className="text-center pt-6">
                    <p className="text-sm text-[#1E498E]/70">
                      {isListening ? 'Mikrofon Aktif - Berbicara sekarang' : 'Klik mikrofon untuk mulai berbicara'}
                    </p>
                  </div>
                  {!isModelLoaded && (
                    <div className="flex items-center gap-2 text-sm text-[#1E498E]/70">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E498E]"></div>
                      <span>Memuat model AI...</span>
                    </div>

                  )}
                </div>
              </div>
            )}

            {/* Analisis Real-time */}
            {showCamera && (
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
                      className={`bg-gradient-to-r from-white/50 to-white/30 p-4 rounded-xl border-l-4 ${currentEmotion.color}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${currentEmotion.color} rounded-full flex items-center justify-center text-white`}>
                            {getEmotionIcon(currentEmotion.emotion)}
                          </div>
                          <div>
                            <p className="text-[#1E498E] font-semibold">{currentEmotion.emotion}</p>
                            <p className="text-xs text-[#1E498E]/70">Confidence: {Math.round(currentEmotion.confidence * 100)}%</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#1E498E]/80 leading-relaxed">
                        {currentEmotion.emotion === 'Bahagia' && 'Anda terlihat bahagia dan ceria! Energi positif Anda sangat menular.'}
                        {currentEmotion.emotion === 'Sedih' && 'Saya melihat kesedihan di ekspresi Anda. Saya di sini untuk mendengarkan.'}
                        {currentEmotion.emotion === 'Marah' && 'Saya mendeteksi kemarahan. Mari kita bicarakan dengan tenang.'}
                        {currentEmotion.emotion === 'Takut' && 'Saya melihat ketakutan. Saya di sini untuk membantu Anda merasa aman.'}
                        {currentEmotion.emotion === 'Netral' && 'Anda terlihat tenang dan seimbang. Kondisi emosi yang stabil.'}
                        {currentEmotion.emotion === 'Terkejut' && 'Anda terlihat terkejut! Ceritakan apa yang terjadi.'}
                        {currentEmotion.emotion === 'Jijik' && 'Saya mendeteksi perasaan tidak nyaman. Mari kita bicarakan.'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-[#1E498E]/50">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Menunggu analisis...</p>
                      <p className="text-sm">Mulai scan untuk melihat hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Emotion History */}
            {showCamera && (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  Riwayat Emosi
                </h3>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {emotionHistory.slice(-8).map((emotion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-white/30 rounded-xl hover:bg-white/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${emotion.color} rounded-full flex items-center justify-center text-white text-sm`}>
                          {getEmotionIcon(emotion.emotion)}
                        </div>
                        <span className="text-[#1E498E] font-medium">{emotion.emotion}</span>
                      </div>
                      <span className="text-xs text-[#1E498E]/70 bg-white/40 px-2 py-1 rounded-full">
                        {Math.round(emotion.confidence * 100)}%
                      </span>
                    </motion.div>
                  ))}
                  {emotionHistory.length === 0 && (
                    <div className="text-center text-[#1E498E]/50 py-8">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada riwayat</p>
                      <p className="text-sm">Mulai scan untuk melihat data</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
