'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/app/service/firebase';
import { collection, query, where, addDoc, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import InputEmoji from 'react-input-emoji';
import {
  Send,
  MoreVertical,
  ArrowLeft,
  User,
  CheckCircle,
  Circle,
  Play,
  Square,
  Clock,
  Stethoscope,
  Timer
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderType: 'user' | 'doctor';
  content: string;
  timestamp: Date;
  read: boolean;
}


interface ConsultationSession {
  id: string;
  appointmentId: string;
  doctorId: string;
  userId: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

function PsikiaterChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAppointment, setCurrentAppointment] = useState<{ doctorName: string; userName: string; doctorId: string; userId: string } | null>(null);
  const [consultationSession, setConsultationSession] = useState<ConsultationSession | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Toast notification function
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000); // Hide after 5 seconds
  };

  // Auth and Appointment Data Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check if user is doctor
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userIsDoctor = userDoc.exists() && userDoc.data()?.isDoctor === true;
          setIsDoctor(userIsDoctor);
        } catch (error) {
          console.error('Error checking user role:', error);
        }
        
        // Load appointment data
        if (appointmentId) {
          try {
            const appointmentRef = doc(db, 'payments', appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);
            
            if (!appointmentSnap.exists()) {
              console.error('Appointment not found');
              alert('Janji temu tidak ditemukan');
            }
          } catch (error) {
            console.error('Error loading appointment:', error);
          }
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appointmentId, router]);

  // Load and listen to consultation session
  useEffect(() => {
    if (!appointmentId || !currentUser) return;

    const loadConsultationSession = async () => {
      try {
        console.log('Loading consultation session for appointment:', appointmentId);
        console.log('Current user is doctor:', isDoctor);
        
        // Check if consultation session exists
        const sessionsRef = collection(db, 'consultationSessions');
        const q = query(sessionsRef, where('appointmentId', '==', appointmentId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Session exists, listen to it
          const sessionDoc = querySnapshot.docs[0];
          const sessionData = sessionDoc.data();
          
          console.log('Found existing session:', sessionData);
          
          setConsultationSession({
            id: sessionDoc.id,
            appointmentId: sessionData.appointmentId,
            doctorId: sessionData.doctorId,
            userId: sessionData.userId,
            status: sessionData.status,
            startedAt: sessionData.startedAt?.toDate(),
            endedAt: sessionData.endedAt?.toDate(),
            createdAt: sessionData.createdAt?.toDate() || new Date()
          });

          // Set up real-time listener
          const unsubscribe = onSnapshot(doc(db, 'consultationSessions', sessionDoc.id), (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              console.log('Session status updated:', data.status);
              setConsultationSession({
                id: doc.id,
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
                userId: data.userId,
                status: data.status,
                startedAt: data.startedAt?.toDate(),
                endedAt: data.endedAt?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date()
              });
            }
          });

          return unsubscribe;
        } else {
          console.log('No existing session found');
          
          // Check if we need to wait for isDoctor to be determined
          if (isDoctor) {
            console.log('Creating new session as doctor');
            // No session exists and user is doctor, create one
            const appointmentRef = doc(db, 'payments', appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);
            
            if (appointmentSnap.exists()) {
              const appointmentData = appointmentSnap.data();
              
              const newSession = {
                appointmentId,
                doctorId: appointmentData.doctorId || currentUser.uid,
                userId: appointmentData.userId,
                status: 'waiting',
                createdAt: serverTimestamp()
              };

              console.log('Creating session with data:', newSession);
              const docRef = await addDoc(collection(db, 'consultationSessions'), newSession);
              
              setConsultationSession({
                id: docRef.id,
                appointmentId,
                doctorId: appointmentData.doctorId || currentUser.uid,
                userId: appointmentData.userId,
                status: 'waiting',
                createdAt: new Date()
              });
            }
          } else {
            console.log('User is not doctor, waiting for session to be created');
          }
        }
      } catch (error) {
        console.error('Error loading consultation session:', error);
      }
    };

    loadConsultationSession();
  }, [appointmentId, currentUser, isDoctor]);

  // Load appointment data
  useEffect(() => {
    if (!appointmentId || !currentUser) return;

    const loadAppointment = async () => {
      try {
        const appointmentRef = doc(db, 'payments', appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);
        
        if (appointmentSnap.exists()) {
          const data = appointmentSnap.data();
          setCurrentAppointment({
            doctorName: data.doctorName || 'Unknown Doctor',
            userName: data.userName || 'Unknown User',
            doctorId: data.doctorId || '',
            userId: data.userId || ''
          });
        }
      } catch (error) {
        console.error('Error loading appointment:', error);
      }
    };

    loadAppointment();
  }, [appointmentId, currentUser]);

  // Real-time Messages Listener
  useEffect(() => {
    if (!appointmentId) return;

    const messagesRef = collection(db, 'consultations', appointmentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          senderId: data.senderId,
          senderType: data.senderType,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false
        });
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [appointmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session control functions
  const handleEndSession = useCallback(async () => {
    if (!consultationSession || !isDoctor) return;
    
    if (!confirm('Apakah Anda yakin ingin mengakhiri sesi konsultasi?')) return;
    
    setSessionLoading(true);
    try {
      const sessionRef = doc(db, 'consultationSessions', consultationSession.id);
      const endTime = new Date();
      
      await updateDoc(sessionRef, {
        status: 'ended',
        endedAt: serverTimestamp()
      });
      
      // Immediately update local state to reflect the change
      setConsultationSession(prev => prev ? {
        ...prev,
        status: 'ended',
        endedAt: endTime
      } : null);
      
      // Show success message
      showToast('✅ Sesi konsultasi berhasil diakhiri. Terima kasih!');
    } catch (error) {
      console.error('Error ending session:', error);
      showToast('❌ Gagal mengakhiri sesi konsultasi: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSessionLoading(false);
    }
  }, [consultationSession, isDoctor]);

  // Timer management for 1-hour session limit
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (consultationSession?.status === 'active' && consultationSession.startedAt) {
      const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      const startTime = consultationSession.startedAt.getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, sessionDuration - elapsed);
        
        setTimeRemaining(remaining);
        
        // Show warning when 10 minutes left (only once)
        if (remaining <= 10 * 60 * 1000 && remaining > 9 * 60 * 1000 && !hasShownWarning && isDoctor) {
          setHasShownWarning(true);
          showToast('⚠️ Sesi konsultasi akan berakhir dalam 10 menit. Mohon persiapkan untuk mengakhiri sesi.');
        }
        
        // Show final warning when 2 minutes left (only once)
        if (remaining <= 2 * 60 * 1000 && remaining > 1 * 60 * 1000 && !hasShownFinalWarning && isDoctor) {
          setHasShownFinalWarning(true);
          showToast('🚨 Sesi konsultasi akan berakhir dalam 2 menit! Segera akhiri sesi.');
        }
        
        // Auto-end session when time is up
        if (remaining === 0 && isDoctor) {
          showToast('⏰ Waktu sesi konsultasi telah habis. Sesi akan diakhiri otomatis.');
          handleEndSession();
        }
      };
      
      // Update immediately
      updateTimer();
      
      // Update every second
      timerRef.current = window.setInterval(updateTimer, 1000);
    } else {
      setTimeRemaining(null);
      setHasShownWarning(false);
      setHasShownFinalWarning(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [consultationSession?.status, consultationSession?.startedAt, hasShownWarning, hasShownFinalWarning, isDoctor, handleEndSession]);

  // Helper function to format time remaining
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Session control functions
  const handleStartSession = async () => {
    console.log('handleStartSession called');
    console.log('consultationSession:', consultationSession);
    console.log('isDoctor:', isDoctor);
    
    if (!consultationSession || !isDoctor) {
      console.log('Cannot start session - missing session or not doctor');
      return;
    }
    
    console.log('Starting session with ID:', consultationSession.id);
    setSessionLoading(true);
    try {
      const sessionRef = doc(db, 'consultationSessions', consultationSession.id);
      const startTime = new Date();
      
      await updateDoc(sessionRef, {
        status: 'active',
        startedAt: serverTimestamp()
      });
      
      // Immediately update local state to reflect the change
      setConsultationSession(prev => prev ? {
        ...prev,
        status: 'active',
        startedAt: startTime
      } : null);
      
      console.log('Session status updated to active');
      // Show success message
      showToast('✅ Sesi konsultasi berhasil dimulai! Pasien sekarang dapat mengirim pesan.');
    } catch (error) {
      console.error('Error starting session:', error);
      showToast('❌ Gagal memulai sesi konsultasi: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSessionLoading(false);
    }
  };


  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentUser || !appointmentId) return;

    // Check if session is active (only for patients)
    if (!isDoctor && consultationSession?.status !== 'active') {
      showToast('❌ Sesi konsultasi belum dimulai. Mohon tunggu dokter memulai sesi.');
      return;
    }

    try {
      const messagesRef = collection(db, 'consultations', appointmentId, 'messages');

      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderType: isDoctor ? 'doctor' : 'user',
        content: inputMessage,
        timestamp: new Date(),
        read: false
      });

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('❌ Gagal mengirim pesan');
    }
  };

  const handleEmojiEnter = (message: string) => {
    if (!message.trim() || !currentUser || !appointmentId) return;

    // Check if session is active (only for patients)
    if (!isDoctor && consultationSession?.status !== 'active') {
      showToast('❌ Sesi konsultasi belum dimulai. Mohon tunggu dokter memulai sesi.');
      return;
    }

    const sendMessage = async () => {
      try {
        const messagesRef = collection(db, 'consultations', appointmentId, 'messages');

        await addDoc(messagesRef, {
          senderId: currentUser.uid,
          senderType: isDoctor ? 'doctor' : 'user',
          content: message,
          timestamp: new Date(),
          read: false
        });
      } catch (error) {
        console.error('Error sending message:', error);
        showToast('❌ Gagal mengirim pesan');
      }
    };

    sendMessage();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#1E498E]/30 border-t-[#1E498E] animate-spin"></div>
          <p className="text-[#1E498E] font-medium">Memuat ruang konsultasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#1E498E]/20 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/page/home">
              <button className="text-[#1E498E] hover:text-[#1E498E]/80 p-2 hover:bg-white/50 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-[#1E498E] truncate">Konsultasi Psikiater</h1>
              <p className="text-sm text-[#1E498E]/70 hidden sm:block">Ruang konsultasi online</p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
            {appointmentId && currentAppointment ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-[#1E498E]/20 bg-white/70 backdrop-blur-sm sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1E498E] to-blue-600 flex items-center justify-center rounded-3xl">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1E498E] text-base">
                          {currentUser?.uid === currentAppointment.doctorId 
                            ? currentAppointment.userName 
                            : currentAppointment.doctorName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-[#1E498E]/70 font-medium flex items-center gap-1">
                            {currentUser?.uid === currentAppointment.doctorId ? (
                              <>
                                <User className="w-4 h-4" />
                                Pasien
                              </>
                            ) : (
                              <>
                                <Stethoscope className="w-4 h-4" />
                                Psikiater
                              </>
                            )}
                          </span>
                          {consultationSession && (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`text-xs font-medium px-2 py-1 flex items-center gap-1 rounded-3xl ${
                                consultationSession.status === 'waiting' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : consultationSession.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {consultationSession.status === 'waiting' && (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    Menunggu
                                  </>
                                )}
                                {consultationSession.status === 'active' && (
                                  <>
                                    <Play className="w-3 h-3" />
                                    Aktif
                                  </>
                                )}
                                {consultationSession.status === 'ended' && (
                                  <>
                                    <Square className="w-3 h-3" />
                                    Berakhir
                                  </>
                                )}
                              </span>
                              
                              {/* Countdown Timer */}
                              {consultationSession.status === 'active' && timeRemaining !== null && (
                                <span className={`text-xs font-mono font-bold px-2 py-1 flex items-center gap-1 rounded-3xl ${
                                  timeRemaining <= 10 * 60 * 1000 
                                    ? 'bg-red-100 text-red-700'
                                    : timeRemaining <= 30 * 60 * 1000
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  <Timer className="w-3 h-3" />
                                  {formatTimeRemaining(timeRemaining)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Session Control Buttons for Doctor */}
                      {isDoctor && consultationSession && (
                        <>
                          {consultationSession.status === 'waiting' && (
                            <button
                              onClick={handleStartSession}
                              disabled={sessionLoading}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm rounded-3xl"
                            >
                              {sessionLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Mulai Sesi</span>
                              <span className="sm:hidden">Mulai</span>
                            </button>
                          )}
                          
                          {consultationSession.status === 'active' && (
                            <button
                              onClick={handleEndSession}
                              disabled={sessionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm rounded-3xl"
                            >
                              {sessionLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Akhiri Sesi</span>
                              <span className="sm:hidden">Akhiri</span>
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        className="p-2 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 bg-white/30 backdrop-blur-sm sm:px-6">
                  {/* Session Status Message for Patients */}
                  {!isDoctor && consultationSession && consultationSession.status !== 'active' && (
                    <div className="mb-6">
                      <div className="bg-white/70 backdrop-blur-sm border-l-4 border-yellow-400 p-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                          <h3 className="font-medium text-[#1E498E]">
                            {consultationSession.status === 'waiting' && 'Menunggu Dokter'}
                            {consultationSession.status === 'ended' && 'Sesi Berakhir'}
                          </h3>
                        </div>
                        <p className="text-sm text-[#1E498E]/70">
                          {consultationSession.status === 'waiting' && 'Dokter belum memulai sesi konsultasi. Mohon tunggu sebentar.'}
                          {consultationSession.status === 'ended' && 'Sesi konsultasi telah berakhir. Terima kasih atas partisipasi Anda.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Session Status Message for Doctors */}
                  {isDoctor && consultationSession && (
                    <div className="mb-6">
                      <div className={`bg-white/70 backdrop-blur-sm border-l-4 p-4 ${
                        consultationSession.status === 'waiting' 
                          ? 'border-blue-400'
                          : consultationSession.status === 'active'
                          ? 'border-green-400'
                          : 'border-gray-400'
                      }`}>
                        {consultationSession.status === 'waiting' && (
                          <div className="flex items-start">
                            <Clock className="w-6 h-6 text-[#1E498E] mr-3 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-[#1E498E] mb-1">Sesi Belum Dimulai</h3>
                              <p className="text-sm text-[#1E498E]/70">Klik &quot;Mulai Sesi&quot; untuk memulai konsultasi dengan pasien.</p>
                            </div>
                          </div>
                        )}
                        {consultationSession.status === 'active' && (
                          <div>
                            <div className="flex items-start mb-3">
                              <div className="w-6 h-6 bg-green-600 mr-3 mt-0.5 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white animate-pulse"></div>
                              </div>
                              <div>
                                <h3 className="font-medium text-[#1E498E] mb-1">Sesi Aktif</h3>
                                <p className="text-sm text-[#1E498E]/70">Konsultasi sedang berlangsung. Pasien dapat mengirim pesan.</p>
                              </div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm p-3 space-y-2 ml-9">
                              {consultationSession.startedAt && (
                                <div className="text-sm text-[#1E498E]/70">
                                  <span className="font-medium">Dimulai:</span> {consultationSession.startedAt.toLocaleTimeString('id-ID')}
                                </div>
                              )}
                              {timeRemaining !== null && (
                                <div className={`text-sm font-mono font-bold flex items-center gap-1 ${
                                  timeRemaining <= 10 * 60 * 1000 
                                    ? 'text-red-600'
                                    : timeRemaining <= 30 * 60 * 1000
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                }`}>
                                  <Timer className="w-4 h-4" />
                                  Waktu tersisa: {formatTimeRemaining(timeRemaining)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {consultationSession.status === 'ended' && (
                          <div>
                            <div className="flex items-start mb-3">
                              <CheckCircle className="w-6 h-6 text-[#1E498E] mr-3 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-[#1E498E] mb-1">Sesi Berakhir</h3>
                                <p className="text-sm text-[#1E498E]/70">Konsultasi telah selesai.</p>
                              </div>
                            </div>
                            {consultationSession.endedAt && (
                              <div className="bg-white/50 backdrop-blur-sm p-3 ml-9">
                                <div className="text-sm text-[#1E498E]/70">
                                  <span className="font-medium">Berakhir:</span> {consultationSession.endedAt.toLocaleTimeString('id-ID')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const isCurrentUserMessage = message.senderId === currentUser?.uid;
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isCurrentUserMessage ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-3xl ${
                                  isCurrentUserMessage
                                    ? 'bg-[#1E498E]'
                                    : 'bg-gray-600'
                                }`}>
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`px-3 py-2 rounded-3xl ${
                                  isCurrentUserMessage
                                    ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 text-white'
                                    : 'bg-white/70 backdrop-blur-sm text-[#1E498E] border border-white/30'
                                }`}>
                                  <p className="text-sm leading-relaxed break-words">{message.content}</p>
                                </div>
                                <div className={`flex items-center gap-2 mt-1 px-1 ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-xs text-[#1E498E]/60">
                                    {message.timestamp.toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {isCurrentUserMessage && (
                                    <div className="flex items-center">
                                      {message.read ? (
                                        <CheckCircle className="w-3 h-3 text-blue-500" />
                                      ) : (
                                        <Circle className="w-3 h-3 text-gray-400" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-4 py-3 border-t border-[#1E498E]/20 bg-white/70 backdrop-blur-sm sm:px-6">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className={`${!isDoctor && consultationSession?.status !== 'active' ? 'pointer-events-none opacity-50' : ''}`}>
                        <InputEmoji
                          value={inputMessage}
                          onChange={setInputMessage}
                          onEnter={handleEmojiEnter}
                          placeholder={
                            !isDoctor && consultationSession?.status !== 'active'
                              ? 'Menunggu dokter memulai sesi...'
                              : 'Ketik pesan Anda...'
                          }
                          cleanOnEnter
                          theme="light"
                          borderRadius={24}
                          borderColor="#1E498E4D"
                          fontSize={14}
                          fontFamily="inherit"
                          height={40}
                          maxLength={1000}
                          shouldReturn={false}
                          shouldConvertEmojiToImage={false}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || (!isDoctor && consultationSession?.status !== 'active')}
                      className={`p-2 transition-all rounded-3xl ${
                        inputMessage.trim() && (isDoctor || consultationSession?.status === 'active')
                          ? 'bg-gradient-to-r from-[#1E498E] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                          : 'bg-white/30 text-[#1E498E]/40 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#1E498E]/60 mt-2 text-center">
                    Tekan Enter untuk kirim • Klik emoji untuk menambahkan
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
        </div>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm border border-[#1E498E]/20 text-[#1E498E] px-6 py-3 shadow-lg max-w-md mx-4"
          >
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PsikiaterChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#1E498E]/30 border-t-[#1E498E] animate-spin"></div>
          <p className="text-[#1E498E] font-medium">Memuat ruang konsultasi...</p>
        </div>
      </div>
    }>
      <PsikiaterChatPageContent />
    </Suspense>
  );
}
