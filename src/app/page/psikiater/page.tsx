'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  ArrowLeft,
  User,
  Star,
  Clock,
  CheckCircle,
  Circle,
  ChevronLeft,
  History
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'psychiatrist';
  content: string;
  timestamp: Date;
  read: boolean;
}

interface ChatSession {
  id: string;
  psychiatristId: string;
  psychiatristName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'ended';
}

interface Psychiatrist {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  rating: number;
  status: 'online' | 'offline';
}

export default function PsikiaterChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const psychiatrists: Psychiatrist[] = [
    {
      id: '1',
      name: 'Dr. Muhammad Iqbal Bayu Aji',
      title: 'Psikiater',
      specialization: ['Anxiety', 'Depression', 'Stress Management'],
      rating: 4.9,
      status: 'online'
    },
    {
      id: '2',
      name: 'Dr. Banon Kenta Oktora',
      title: 'Psikiater',
      specialization: ['Trauma', 'PTSD', 'Addiction'],
      rating: 4.8,
      status: 'offline'
    },
    {
      id: '3',
      name: 'Dr. Daffa Kumara',
      title: 'Psikiater',
      specialization: ['Child Psychology', 'Family Therapy'],
      rating: 4.9,
      status: 'offline'
    }
  ];

  const chatSessions: ChatSession[] = [
    {
      id: '1',
      psychiatristId: '1',
      psychiatristName: 'Dr. Muhammad Iqbal Bayu Aji',
      lastMessage: 'Bagaimana perasaan Anda hari ini?',
      lastMessageTime: new Date(2025, 0, 30, 14, 30),
      unreadCount: 2,
      status: 'active'
    },
    {
      id: '2',
      psychiatristId: '2',
      psychiatristName: 'Dr. Banon Kenta Oktora',
      lastMessage: 'Terima kasih sudah berbagi cerita Anda.',
      lastMessageTime: new Date(2025, 0, 28, 10, 15),
      unreadCount: 0,
      status: 'ended'
    },
    {
      id: '3',
      psychiatristId: '3',
      psychiatristName: 'Dr. Daffa Kumara',
      lastMessage: 'Saya akan memberikan beberapa saran untuk Anda.',
      lastMessageTime: new Date(2025, 0, 25, 16, 45),
      unreadCount: 0,
      status: 'ended'
    }
  ];

  const initialMessages: Message[] = [
    {
      id: '1',
      sender: 'psychiatrist',
      content: 'Selamat siang! Saya Dr. Muhammad Iqbal Bayu Aji. Bagaimana kabar Anda hari ini?',
      timestamp: new Date(2025, 0, 30, 14, 0),
      read: true
    },
    {
      id: '2',
      sender: 'user',
      content: 'Halo Dokter, saya merasa cukup cemas akhir-akhir ini.',
      timestamp: new Date(2025, 0, 30, 14, 5),
      read: true
    },
    {
      id: '3',
      sender: 'psychiatrist',
      content: 'Saya mengerti. Bisakah Anda ceritakan lebih detail tentang apa yang membuat Anda merasa cemas?',
      timestamp: new Date(2025, 0, 30, 14, 10),
      read: true
    },
    {
      id: '4',
      sender: 'user',
      content: 'Saya merasa tertekan dengan pekerjaan dan sering sulit tidur.',
      timestamp: new Date(2025, 0, 30, 14, 15),
      read: true
    },
    {
      id: '5',
      sender: 'psychiatrist',
      content: 'Terima kasih sudah berbagi. Stres kerja memang bisa sangat mempengaruhi kualitas tidur. Mari kita diskusikan beberapa strategi untuk mengelola stres Anda.',
      timestamp: new Date(2025, 0, 30, 14, 20),
      read: true
    }
  ];

  useEffect(() => {
    if (selectedChat) {
      setMessages(initialMessages);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate psychiatrist response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'psychiatrist',
        content: 'Terima kasih sudah berbagi. Saya akan membantu Anda mengatasi hal ini.',
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentPsychiatrist = psychiatrists.find(p => p.id === chatSessions.find(c => c.id === selectedChat)?.psychiatristId);
  const currentSession = chatSessions.find(c => c.id === selectedChat);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/page/home">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/80 backdrop-blur-sm text-[#1E498E] p-2 rounded-lg hover:bg-white transition-colors shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          </Link>
          <h1 className="text-2xl font-bold text-[#1E498E]">Konsultasi Psikiater</h1>
        </div>

        {/* Main Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-150px)]">
          {/* Left Sidebar - Chat History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1E498E]">Riwayat Chat</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <History className="w-5 h-5 text-[#1E498E]" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari chat..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E498E]/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chatSessions.map((session) => (
                <motion.button
                  key={session.id}
                  onClick={() => setSelectedChat(session.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-4 border-b border-gray-100 text-left transition-colors ${
                    selectedChat === session.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E498E] to-blue-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[#1E498E] text-sm truncate">
                          {session.psychiatristName}
                        </h3>
                        {session.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{session.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {session.lastMessageTime.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {session.status === 'active' ? 'Aktif' : 'Selesai'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {selectedChat && currentPsychiatrist ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E498E] to-blue-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        {currentPsychiatrist.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1E498E]">{currentPsychiatrist.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{currentPsychiatrist.title}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">{currentPsychiatrist.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-[#1E498E]" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                : 'bg-gradient-to-br from-[#1E498E] to-blue-600'
                            }`}>
                              <User className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className={`rounded-2xl p-4 ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-2">
                              <span className="text-xs text-gray-400">
                                {message.timestamp.toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {message.sender === 'user' && (
                                message.read ? (
                                  <CheckCircle className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <Circle className="w-3 h-3 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white/50">
                  <div className="flex items-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </motion.button>
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ketik pesan Anda..."
                      className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-[#1E498E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E498E]/30 resize-none min-h-[50px] max-h-[150px]"
                      rows={1}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Smile className="w-5 h-5 text-gray-600" />
                    </motion.button>
                    <motion.button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      whileHover={{ scale: inputMessage.trim() ? 1.05 : 1 }}
                      whileTap={{ scale: inputMessage.trim() ? 0.95 : 1 }}
                      className={`p-3 rounded-xl transition-all ${
                        inputMessage.trim()
                          ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Tekan Enter untuk kirim • Shift + Enter untuk baris baru
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E498E] mb-2">Pilih Chat</h3>
                  <p className="text-gray-600">
                    Pilih chat dari riwayat untuk mulai berkonsultasi
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
