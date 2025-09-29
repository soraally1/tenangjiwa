"use client"
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMentalHealthDetection } from '@/app/hooks/useMentalHealthDetection';
import {
  Camera,
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Send,
  MessageCircle,
  Activity,
  Eye,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react';
import Navbar from '@/app/component/navbar';

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  emotion?: string;
}

export default function AIEmotionScanner() {
  const [story, setStory] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scanDuration, setScanDuration] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use mental health detection hook
  const {
    isModelLoaded,
    faceDetected,
    currentEmotion,
    emotionHistory,
    isDetecting,
    mentalHealthAssessment,
    eyeTrackingData,
    behavioralData,
    startDetection,
    stopDetection,
    clearHistory,
    canvasRef
  } = useMentalHealthDetection();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to get emotion icon
  const getEmotionIcon = (emotion: string) => {
    const iconMap = {
      'Bahagia': <Smile className="w-5 h-5" />,
      'Sedih': <Frown className="w-5 h-5" />,
      'Marah': <Zap className="w-5 h-5" />,
      'Takut': <Frown className="w-5 h-5" />,
      'Jijik': <Meh className="w-5 h-5" />,
      'Terkejut': <Heart className="w-5 h-5" />,
      'Netral': <Meh className="w-5 h-5" />,
    };
    return iconMap[emotion as keyof typeof iconMap] || <Meh className="w-5 h-5" />;
  };

  const getAIResponse = (userMessage: string, currentEmotion?: { emotion: string; confidence: number }): string => {
    const emotionResponses = {
      Bahagia: [
        "Senang melihat Anda bahagia! Ceritakan lebih lanjut tentang apa yang membuat Anda gembira.",
        "Energi positif Anda sangat menular! Apa yang sedang membuat hari Anda istimewa?",
        "Saya bisa merasakan kebahagiaan Anda. Mari berbagi cerita indah ini!",
      ],
      Sedih: [
        "Saya melihat ada kesedihan di mata Anda. Saya di sini untuk mendengarkan cerita Anda.",
        "Terkadang berbagi perasaan bisa membantu. Apa yang sedang mengganggu pikiran Anda?",
        "Ingatlah bahwa perasaan sedih adalah bagian normal dari hidup. Ceritakan pada saya.",
      ],
      Marah: [
        "Saya mendeteksi kemarahan. Mari kita bicarakan apa yang membuat Anda marah.",
        "Kemarahan adalah perasaan yang valid. Ceritakan apa yang terjadi.",
        "Saya di sini untuk mendengarkan. Apa yang sedang mengganggu Anda?",
      ],
      Takut: [
        "Saya melihat ketakutan di mata Anda. Saya di sini untuk membantu Anda merasa aman.",
        "Takut adalah perasaan yang normal. Ceritakan apa yang membuat Anda takut.",
        "Mari kita bicarakan ketakutan Anda bersama-sama.",
      ],
      Jijik: [
        "Saya mendeteksi perasaan jijik. Apa yang membuat Anda merasa seperti ini?",
        "Perasaan jijik bisa menjadi sinyal penting. Ceritakan pada saya.",
        "Saya di sini untuk mendengarkan perasaan Anda.",
      ],
      Terkejut: [
        "Anda terlihat terkejut! Apa yang baru saja terjadi?",
        "Kejutan bisa membawa berbagai perasaan. Ceritakan pada saya.",
        "Saya penasaran dengan apa yang membuat Anda terkejut.",
      ],
      Netral: [
        "Anda terlihat tenang dan seimbang. Bagaimana perasaan Anda hari ini?",
        "Saya melihat ketenangan dalam ekspresi Anda. Ada yang ingin Anda ceritakan?",
        "Kondisi emosi yang stabil menunjukkan kedewasaan. Mari berbincang!",
      ],
    };

    const generalResponses = [
      "Terima kasih sudah berbagi dengan saya. Bagaimana perasaan Anda sekarang?",
      "Saya mendengarkan dengan seksama. Ada lagi yang ingin Anda ceritakan?",
      "Itu menarik! Saya senang bisa mendengar cerita Anda.",
      "Saya memahami perasaan Anda. Mari kita bicarakan lebih lanjut.",
    ];

    if (currentEmotion) {
      const responses = emotionResponses[currentEmotion.emotion as keyof typeof emotionResponses];
      return responses ? responses[Math.floor(Math.random() * responses.length)] : generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
      emotion: currentEmotion?.emotion,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputMessage, currentEmotion || undefined),
        sender: "ai",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const startCamera = async () => {
    if (!isModelLoaded) {
      alert("Model AI sedang dimuat, silakan tunggu sebentar...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanDuration(0);
        // Start face detection
        await startDetection(videoRef.current);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    stopDetection();
  };

  const resetAnalysis = () => {
    clearHistory();
    setStory("");
    setChatMessages([]);
    setScanDuration(0);
  };

  // Update story based on detected emotion
  useEffect(() => {
    if (!currentEmotion) {
      setStory("");
      return;
    }

    const stories = {
      Bahagia: "Saya melihat kebahagiaan yang terpancar dari mata Anda! Energi positif ini menunjukkan bahwa Anda sedang dalam suasana hati yang baik.",
      Sedih: "Sepertinya ada kesedihan yang Anda rasakan. Ingatlah bahwa perasaan ini normal dan akan berlalu.",
      Marah: "Saya mendeteksi kemarahan dalam ekspresi Anda. Mari kita bicarakan apa yang membuat Anda marah.",
      Takut: "Saya melihat ketakutan di mata Anda. Saya di sini untuk membantu Anda merasa aman.",
      Jijik: "Saya mendeteksi perasaan jijik. Mari kita bicarakan apa yang membuat Anda merasa seperti ini.",
      Terkejut: "Anda terlihat terkejut! Apa yang baru saja terjadi?",
      Netral: "Anda terlihat tenang dan seimbang. Kondisi emosi yang stabil ini menunjukkan kedewasaan emosional.",
    };

    setStory(stories[currentEmotion.emotion as keyof typeof stories] || "Sedang menganalisis emosi Anda...");
  }, [currentEmotion]);

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

  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {isClient && [...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-10, -30, -10],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative overflow-hidden">
      <FloatingElements />
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 relative z-10">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full mb-6 mt-12"
            whileHover={{ scale: 1.05 }}
          >
            <Brain className="text-[#1E498E] w-5 h-5" />
            <span className="text-[#1E498E] font-semibold">AI Analisis Emosi Terpercaya</span>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Left Column - Camera and Chat */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            {/* Camera Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Camera */}
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
                  <div className="p-10 border-b border-white/20">
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
                            <p className="text-sm">Klik tombol &quot;Mulai Scan&quot; untuk memulai</p>
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

                      <motion.button
                        onClick={resetAnalysis}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="border-2 border-[#1E498E] text-[#1E498E] hover:bg-[#1E498E]/10 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mascot Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="col-span-1 lg:col-span-1"
              >
                <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6 h-full">
                  <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                    <Image 
                      src="/Tenjin.svg" 
                      alt="TenJin" 
                      width={24}
                      height={24}
                      className="w-6 h-6" />
                    TenJin
                  </h3>
                  
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto mb-4 rounded-full flex items-center justify-center p-4">
                      <Image 
                        src="/Tenjin.svg" 
                        alt="TenJin" 
                        width={96}
                        height={96}
                        className="w-full h-full object-contain" />
                    </div>
                    <h4 className="text-[#1E498E] font-semibold text-lg mb-2">TenJin</h4>
                    <p className="text-[#1E498E]/70 text-sm leading-relaxed">
                      Haii SahabatJiwa! Saya di sini untuk membantu Anda memahami dan mengelola emosi dengan lebih baik.
                    </p>
                    
                    <div className="mt-4 p-3 bg-white/30 rounded-xl">
                      <p className="text-xs text-[#1E498E]/70 mb-1">Status:</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-[#1E498E] font-medium">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Chat Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
                <div className="p-6 border-b border-white/20">
                  <h3 className="text-[#1E498E] font-semibold text-xl flex items-center gap-3">
                    <Image 
                      src="/Tenjin.svg" 
                      alt="TenJin" 
                      width={24}
                      height={24}
                      className="w-6 h-6" />
                    Chat dengan TenJin
                  </h3>
                  <p className="text-[#1E498E]/70 text-sm mt-1">AI akan merespons berdasarkan emosi yang terdeteksi</p>
                </div>

                <div className="h-80 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-[#1E498E]/50 py-12">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium mb-2">Mulai percakapan dengan AI!</h4>
                      <p className="text-sm">Ceritakan perasaan Anda dan AI akan memberikan respons yang sesuai</p>
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${message.sender === "user"
                        ? "bg-[#1E498E] text-white"
                        : "bg-white/80 text-[#1E498E] backdrop-blur-sm"
                        }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.emotion && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
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
                      <div className="bg-white/80 backdrop-blur-sm text-[#1E498E] px-4 py-3 rounded-2xl shadow-lg">
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

                <div className="p-6 border-t border-white/20">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ceritakan perasaan Anda disini..."
                      className="flex-1 px-4 py-3 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E498E] focus:border-transparent text-[#1E498E] bg-white/50 backdrop-blur-sm placeholder-[#1E498E]/50"
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#1E498E] hover:bg-[#1E498E]/90 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Analysis Sections */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 lg:col-span-1 space-y-6"
          >
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
                {story ? (
                  <motion.div
                    key={story}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-gradient-to-r ${currentEmotion?.bgGradient || 'from-gray-100/50 to-gray-200/50'} p-4 rounded-xl border-l-4 ${currentEmotion?.color || 'border-gray-400'}`}
                  >
                    <p className="text-[#1E498E] leading-relaxed text-sm">{story}</p>
                    {currentEmotion && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-[#1E498E]/70">Status:</span>
                        <span className={`${currentEmotion.color} text-white px-3 py-1 text-xs rounded-full flex items-center gap-1`}>
                          {getEmotionIcon(currentEmotion.emotion)}
                          {currentEmotion.emotion}
                        </span>
                      </div>
                    )}
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

            {/* Mental Health Analysis */}
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

                  {/* Professional Help Alert */}
                  {mentalHealthAssessment.professionalHelpNeeded && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-red-800">
                          Disarankan konsultasi profesional
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {mentalHealthAssessment.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Rekomendasi:</h4>
                      <ul className="space-y-1">
                        {mentalHealthAssessment.recommendations.slice(0, 3).map((recommendation, index) => (
                          <li key={index} className="text-xs text-blue-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Eye Tracking Data */}
            {eyeTrackingData && (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  Analisis Mata
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Kontak Mata</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(eyeTrackingData.eyeContactDuration * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Frekuensi Kedipan</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(eyeTrackingData.blinkRate)}/menit
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Stabilitas Pandangan</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(eyeTrackingData.gazeStability * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Behavioral Analysis */}
            {behavioralData && (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                  <Activity className="w-6 h-6" />
                  Analisis Perilaku
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Frekuensi Senyum</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(behavioralData.smileFrequency * 10)}/menit
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Gerakan Kepala</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(behavioralData.headMovement * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Keterlibatan Sosial</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(behavioralData.socialEngagement * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#1E498E]">Tingkat Energi</span>
                    <span className="text-sm font-medium text-[#1E498E]">
                      {Math.round(behavioralData.energyLevel * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Emotion History */}
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
              <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Riwayat Emosi
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}