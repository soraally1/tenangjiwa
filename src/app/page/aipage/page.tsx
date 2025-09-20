"use client"
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface EmotionData {
  emotion: string;
  confidence: number;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  emotion?: string;
}

export default function AIEmotionScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [story, setStory] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scanDuration, setScanDuration] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const emotions: EmotionData[] = [
    {
      emotion: "Bahagia",
      confidence: 0.85,
      icon: <Smile className="w-5 h-5" />,
      color: "bg-green-500",
      bgGradient: "from-green-400/20 to-green-600/20"
    },
    {
      emotion: "Sedih",
      confidence: 0.72,
      icon: <Frown className="w-5 h-5" />,
      color: "bg-blue-500",
      bgGradient: "from-blue-400/20 to-blue-600/20"
    },
    {
      emotion: "Netral",
      confidence: 0.65,
      icon: <Meh className="w-5 h-5" />,
      color: "bg-gray-500",
      bgGradient: "from-gray-400/20 to-gray-600/20"
    },
    {
      emotion: "Cinta",
      confidence: 0.78,
      icon: <Heart className="w-5 h-5" />,
      color: "bg-pink-500",
      bgGradient: "from-pink-400/20 to-pink-600/20"
    },
    {
      emotion: "Stres",
      confidence: 0.68,
      icon: <Zap className="w-5 h-5" />,
      color: "bg-red-500",
      bgGradient: "from-red-400/20 to-red-600/20"
    },
  ];

  const getAIResponse = (userMessage: string, currentEmotion?: EmotionData): string => {
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
      Netral: [
        "Anda terlihat tenang dan seimbang. Bagaimana perasaan Anda hari ini?",
        "Saya melihat ketenangan dalam ekspresi Anda. Ada yang ingin Anda ceritakan?",
        "Kondisi emosi yang stabil menunjukkan kedewasaan. Mari berbincang!",
      ],
      Cinta: [
        "Ada kehangatan yang terpancar dari Anda! Sedang memikirkan seseorang yang spesial?",
        "Perasaan cinta membuat hidup lebih bermakna. Ceritakan tentang hal yang Anda cintai.",
        "Saya merasakan energi kasih sayang dari Anda. Apa yang membuat hati Anda hangat?",
      ],
      Stres: [
        "Saya mendeteksi tanda-tanda stres. Mari kita bicarakan apa yang sedang membebani Anda.",
        "Bernapas dalam-dalam dulu. Saya di sini untuk membantu Anda merasa lebih baik.",
        "Stres adalah sinyal bahwa Anda perlu istirahat. Ceritakan apa yang terjadi.",
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
      return responses[Math.floor(Math.random() * responses.length)];
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setScanDuration(0);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const resetAnalysis = () => {
    setCurrentEmotion(null);
    setEmotionHistory([]);
    setStory("");
    setChatMessages([]);
    setScanDuration(0);
  };

  // Scanning effect and emotion detection
  useEffect(() => {
    if (!isScanning) return;

    const durationInterval = setInterval(() => {
      setScanDuration(prev => prev + 1);
    }, 1000);

    const interval = setInterval(() => {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(randomEmotion);

      setEmotionHistory((prev) => {
        const newHistory = [...prev, randomEmotion];
        return newHistory.slice(-10);
      });

      const stories = {
        Bahagia: "Saya melihat kebahagiaan yang terpancar dari mata Anda! Energi positif ini menunjukkan bahwa Anda sedang dalam suasana hati yang baik.",
        Sedih: "Sepertinya ada kesedihan yang Anda rasakan. Ingatlah bahwa perasaan ini normal dan akan berlalu.",
        Netral: "Anda terlihat tenang dan seimbang. Kondisi emosi yang stabil ini menunjukkan kedewasaan emosional.",
        Cinta: "Ada kehangatan dan kasih sayang yang terpancar dari ekspresi Anda. Perasaan cinta membuat hidup lebih bermakna.",
        Stres: "Saya mendeteksi tanda-tanda stres. Cobalah untuk bernapas dalam-dalam dan rileks sejenak.",
      };

      setStory(stories[randomEmotion.emotion as keyof typeof stories] || "Sedang menganalisis emosi Anda...");
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(durationInterval);
    };
  }, [isScanning]);

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

          <h1 className="text-5xl md:text-6xl font-bold text-[#1E498E] mb-6 leading-tight">
            Deteksi Emosi dengan
            <span className="block bg-gradient-to-r from-[#1E498E] to-[#1E498E]/70 bg-clip-text text-transparent">
              Teknologi AI Canggih
            </span>
          </h1>

          <p className="text-xl text-[#1E498E]/70 max-w-3xl mx-auto leading-relaxed">
            Analisis emosi real-time melalui ekspresi wajah menggunakan teknologi AI terdepan.
            Dapatkan insight mendalam tentang kondisi emosional Anda dengan akurasi tinggi.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid xl:grid-cols-3 gap-6 mb-8">
          {/* Camera Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2"
          >
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1E498E] font-semibold text-xl flex items-center gap-3">
                    <Eye className="w-6 h-6" />
                    Live Camera Feed
                  </h3>
                  {isScanning && (
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

                  {/* Scanning Animation */}
                  <AnimatePresence>
                    {isScanning && (
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
                                {currentEmotion.icon}
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
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/70">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">Kamera tidak aktif</p>
                        <p className="text-sm">Klik tombol "Mulai Scan" untuk memulai</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {!isScanning ? (
                    <motion.button
                      onClick={startCamera}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#1E498E] hover:bg-[#1E498E]/90 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg"
                    >
                      <Play className="w-5 h-5" />
                      Mulai Scan
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
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Current Analysis */}
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
              <h3 className="text-[#1E498E] font-semibold text-xl mb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                Analisis Real-time
              </h3>

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
                          {currentEmotion.icon}
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
                        {emotion.icon}
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

        {/* Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
            <div className="p-6 border-b border-white/20">
              <h3 className="text-[#1E498E] font-semibold text-xl flex items-center gap-3">
                <MessageCircle className="w-6 h-6" />
                Chat dengan siTenang
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
    </div>
  );
}