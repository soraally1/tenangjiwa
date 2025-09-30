'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useMentalHealthDetection } from '@/app/hooks/useMentalHealthDetection';
import { Camera, TrendingUp, Clock, Eye, Activity, Brain, Play, Pause, Smile, Frown, Meh, Zap, Plane, Sparkles, Video, VideoOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CeritaTenjinPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanDuration, setScanDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    // Welcome message
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            role: 'assistant',
            content: 'Hai! Aku TenJin, sahabat jiwa kamu. Aku di sini untuk mendengarkan cerita kamu dengan penuh perhatian. Ceritakan apa yang ada di pikiran kamu hari ini? 😊',
            timestamp: new Date(),
          },
        ]);
      }, 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Generate AI response based on emotion
    setTimeout(() => {
      let responseText = 'Terima kasih sudah berbagi dengan saya. Saya bisa merasakan apa yang kamu rasakan.';
      
      if (currentEmotion) {
        const emotionResponses: Record<string, string> = {
          'Sedih': 'Saya melihat kesedihan di mata kamu. Saya di sini untuk mendengarkan. Ceritakan lebih lanjut tentang apa yang kamu rasakan.',
          'Bahagia': 'Senang melihat kamu bahagia! Energi positif kamu sangat menular. Apa yang membuat kamu gembira hari ini?',
          'Marah': 'Saya mendeteksi kemarahan dalam ekspresi kamu. Mari kita bicarakan apa yang membuat kamu marah dengan tenang.',
          'Takut': 'Saya melihat ketakutan di mata kamu. Saya di sini untuk membantu kamu merasa aman. Ceritakan apa yang membuat kamu takut.',
          'Netral': 'Kamu terlihat tenang dan seimbang. Kondisi emosi yang stabil ini bagus. Ada yang ingin kamu ceritakan?',
          'Terkejut': 'Kamu terlihat terkejut! Apa yang baru saja terjadi? Ceritakan padaku.',
          'Jijik': 'Saya mendeteksi perasaan tidak nyaman. Mari kita bicarakan apa yang membuat kamu merasa seperti ini.'
        };
        responseText = emotionResponses[currentEmotion.emotion] || responseText;
      } else {
        const responses = [
          'Terima kasih sudah berbagi dengan saya. Bagaimana perasaan kamu sekarang setelah menceritakan ini?',
          'Aku mendengarkan dengan penuh perhatian. Sepertinya kamu sedang menghadapi sesuatu yang tidak mudah. Mau cerita lebih lanjut?',
          'Aku di sini untuk kamu. Perasaan yang kamu rasakan itu valid dan wajar. Apa yang bisa aku bantu untuk membuat kamu merasa lebih baik?',
          'Terima kasih sudah mempercayai aku dengan cerita ini. Kamu sangat berani untuk membagikan perasaan kamu. Bagaimana kalau kita coba cari solusi bersama?',
        ];
        responseText = responses[Math.floor(Math.random() * responses.length)];
      }

      const aiResponse: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  return (
    <div className="bg-gradient-to-b from-blue-100 via-cyan-100 to-teal-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 4,
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#1E498E] mb-2">Cerita Ketik dengan TenJin</h1>
            <p className="text-[#1E498E]/70">Tulis dan bagikan cerita kamu dengan bebas ✍️</p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chat */}
          <div className="col-span-1 lg:col-span-2 flex flex-col h-[calc(100vh-250px)]">
            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 overflow-y-auto mb-6"
            >
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-gradient-to-r from-[#1E498E] to-blue-600' : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                    }`}>
                      <Image src="/Tenjin.png" width={40} height={40} alt="TenJin" />
                    </div>
                    
                    <div>
                      <div
                        className={`rounded-2xl p-4 shadow-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-[#1E498E] rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1 opacity-80">
                          {message.role === 'user' ? 'Kamu' : 'TenJin'}
                        </p>
                        <p className="leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-[#1E498E]/50 mt-1 px-2">
                        {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[75%]">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-lg">
                    <div className="flex gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-[#1E498E] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-[#1E498E] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-[#1E498E] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </motion.div>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-4"
            >
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ketik cerita kamu di sini..."
                  className="flex-1 bg-white/50 rounded-xl px-4 py-3 text-[#1E498E] placeholder-[#1E498E]/50 focus:outline-none focus:ring-2 focus:ring-[#1E498E]/30 resize-none min-h-[60px] max-h-[150px]"
                  rows={2}
                />
                <motion.button
                  onClick={handleSendMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputText.trim() || isTyping}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                    inputText.trim() && !isTyping
                      ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 text-white hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">✈️</span>
                </motion.button>
              </div>
              <p className="text-xs text-[#1E498E]/50 mt-2 text-center">
                Tekan Enter untuk kirim • Shift + Enter untuk baris baru
              </p>
            </motion.div>
          </div>

          {/* Right Column - Camera & Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 lg:col-span-1 space-y-6"
          >
            {/* Camera Toggle & Feed */}
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
                        className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg ${
                          isModelLoaded 
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
                  
                  {/* Camera Toggle Button */}
                  <motion.button
                    onClick={showCamera ? stopCamera : startCamera}
                    disabled={!isModelLoaded}
                    whileHover={{ scale: isModelLoaded ? 1.05 : 1 }}
                    whileTap={{ scale: isModelLoaded ? 0.95 : 1 }}
                    className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
                      !isModelLoaded
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


                  {!isModelLoaded && (
                    <div className="flex items-center gap-2 text-sm text-[#1E498E]/70 mt-4">
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

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
