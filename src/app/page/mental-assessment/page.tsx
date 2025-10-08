'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, Smile, Loader, Brain, Target, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/component/navbar'
import { auth } from '@/app/service/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { saveAssessmentTasksToGoals } from '@/app/service/goalService'

interface Question {
  id: number
  text: string
  options: { value: number; label: string }[]
}

interface Task {
  title: string
  description: string
  targetValue: number
  unit: string
  category: 'mental-health' | 'productivity' | 'wellness' | 'learning' | 'social' | 'personal'
  priority: 'low' | 'medium' | 'high'
}

interface AnalysisResult {
  severity: 'Baik' | 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat'
  score: number
  analysis: string
  recommendations: string[]
  tasks?: Task[]
}

type Step = 'story' | 'questions' | 'result'

export default function MentalAssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('story')
  const [userStory, setUserStory] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [savingTasks, setSavingTasks] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Get current user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
      }
    })
    
    return () => unsubscribe()
  }, [])

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
  )

  const handleGenerateQuestions = async () => {
    if (!userStory.trim() || userStory.length < 50) {
      alert('Mohon ceritakan keluh kesah Anda dengan lebih detail (minimal 50 karakter)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: userStory })
      })

      if (response.ok) {
        const questionsData = await response.json()
        setQuestions(questionsData.questions)
        setStep('questions')
      } else {
        alert('Gagal membuat pertanyaan. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
    setLoading(false)
  }

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value })
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    // Calculate total score
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0)
    const maxScore = questions.length * 3
    const percentage = (totalScore / maxScore) * 100

    // Prepare answers text for AI analysis
    const answersText = questions.map((q, idx) => {
      const answerValue = answers[q.id] || 0
      const answerLabel = q.options.find(opt => opt.value === answerValue)?.label
      return `Q${idx + 1}: ${q.text}\nJawaban: ${answerLabel}`
    }).join('\n\n')

    try {
      // Call AI API for detailed analysis
      const response = await fetch('/api/analyze-mental-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: userStory,
          answers: answersText,
          score: totalScore,
          maxScore: maxScore
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Analysis result:', data) // Debug log
        console.log('Tasks in result:', data.tasks) // Debug log
        setResult(data)
        setStep('result')
      } else {
        // Fallback to basic analysis
        const basicResult = getBasicAnalysis(totalScore, percentage)
        setResult(basicResult)
        setStep('result')
      }
    } catch (error) {
      console.error('Error analyzing:', error)
      // Fallback to basic analysis
      const basicResult = getBasicAnalysis(totalScore, percentage)
      setResult(basicResult)
      setStep('result')
    }
    
    setLoading(false)
  }

  const getBasicAnalysis = (score: number, percentage: number): AnalysisResult => {
    let severity: AnalysisResult['severity']
    let analysis: string
    let recommendations: string[]
    let tasks: Task[]

    if (percentage <= 20) {
      severity = 'Baik'
      analysis = 'Kesehatan mental Anda dalam kondisi baik. Anda menunjukkan tanda-tanda kesejahteraan mental yang positif dengan tingkat stres dan kecemasan yang minimal.'
      recommendations = [
        'Pertahankan pola hidup sehat Anda',
        'Lakukan aktivitas yang Anda sukai secara rutin',
        'Jaga hubungan sosial yang positif',
        'Praktikkan mindfulness atau meditasi untuk menjaga keseimbangan'
      ]
      tasks = [
        { title: 'Jurnal Syukur Harian', description: 'Menulis 3 hal yang disyukuri setiap hari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'medium' },
        { title: 'Olahraga Rutin', description: 'Berolahraga minimal 30 menit, 3x seminggu', targetValue: 12, unit: 'sessions', category: 'wellness', priority: 'medium' }
      ]
    } else if (percentage <= 40) {
      severity = 'Ringan'
      analysis = 'Anda mengalami beberapa tanda stres atau kecemasan ringan. Ini adalah hal yang normal, namun perlu diperhatikan agar tidak berkembang menjadi lebih serius.'
      recommendations = [
        'Identifikasi sumber stres dan cari cara untuk mengelolanya',
        'Tingkatkan kualitas tidur Anda',
        'Lakukan olahraga ringan secara teratur',
        'Bicarakan perasaan Anda dengan orang terdekat',
        'Pertimbangkan teknik relaksasi seperti pernapasan dalam'
      ]
      tasks = [
        { title: 'Meditasi Pagi', description: 'Meditasi mindfulness 10 menit setiap pagi', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Tidur Teratur', description: 'Tidur 7-8 jam dengan jadwal konsisten', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'high' },
        { title: 'Olahraga Ringan', description: 'Jalan kaki atau yoga 3x seminggu', targetValue: 12, unit: 'sessions', category: 'wellness', priority: 'medium' }
      ]
    } else if (percentage <= 60) {
      severity = 'Sedang'
      analysis = 'Anda menunjukkan gejala stres atau masalah kesehatan mental tingkat sedang yang mulai mempengaruhi kehidupan sehari-hari. Sangat disarankan untuk mencari bantuan profesional.'
      recommendations = [
        'Konsultasi dengan psikolog atau psikiater',
        'Pertimbangkan untuk mengikuti terapi',
        'Buat jadwal rutin dan patuhi',
        'Hindari alkohol dan kafein berlebihan',
        'Bergabung dengan support group',
        'Praktikkan self-care secara konsisten'
      ]
      tasks = [
        { title: 'Konsultasi Profesional', description: 'Jadwalkan dan hadiri sesi terapi', targetValue: 4, unit: 'sesi', category: 'mental-health', priority: 'high' },
        { title: 'Breathing Exercise', description: 'Latihan pernapasan 3x sehari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Rutinitas Harian', description: 'Buat dan ikuti jadwal harian', targetValue: 30, unit: 'hari', category: 'productivity', priority: 'medium' },
        { title: 'Social Connection', description: 'Bertemu teman/keluarga minimal 1x seminggu', targetValue: 4, unit: 'pertemuan', category: 'social', priority: 'medium' }
      ]
    } else if (percentage <= 80) {
      severity = 'Berat'
      analysis = 'Anda mengalami gejala yang cukup serius yang mempengaruhi fungsi kehidupan sehari-hari Anda. Sangat penting untuk segera mencari bantuan profesional.'
      recommendations = [
        'Segera konsultasi dengan psikiater',
        'Pertimbangkan terapi intensif',
        'Informasikan kondisi Anda kepada keluarga terdekat',
        'Hindari membuat keputusan besar saat ini',
        'Jangan ragu untuk mencari emergency help jika diperlukan',
        'Ikuti treatment plan yang diberikan profesional'
      ]
      tasks = [
        { title: 'Terapi Profesional', description: 'Sesi terapi intensif dengan psikiater', targetValue: 8, unit: 'sesi', category: 'mental-health', priority: 'high' },
        { title: 'Mood Tracking', description: 'Catat mood dan perasaan setiap hari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Support System', description: 'Hubungi support person setiap hari', targetValue: 30, unit: 'hari', category: 'social', priority: 'high' },
        { title: 'Self-Care Routine', description: 'Lakukan aktivitas self-care minimal 15 menit/hari', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'medium' }
      ]
    } else {
      severity = 'Sangat Berat'
      analysis = 'Anda menunjukkan gejala yang sangat serius. Ini memerlukan perhatian medis segera. Jangan menunda untuk mencari bantuan profesional.'
      recommendations = [
        'SEGERA hubungi profesional kesehatan mental',
        'Pertimbangkan rawat inap jika disarankan',
        'Jangan tinggal sendirian, minta dukungan keluarga',
        'Hubungi hotline krisis jika memiliki pikiran untuk menyakiti diri: 119 ext 8',
        'Ikuti semua anjuran medis dengan ketat',
        'Fokus pada kesembuhan sebagai prioritas utama'
      ]
      tasks = [
        { title: 'Crisis Intervention', description: 'Hubungi dan bertemu psikiater SEGERA', targetValue: 1, unit: 'konsultasi', category: 'mental-health', priority: 'high' },
        { title: 'Safety Planning', description: 'Buat rencana keamanan dengan profesional', targetValue: 1, unit: 'plan', category: 'mental-health', priority: 'high' },
        { title: 'Daily Check-in', description: 'Check-in dengan support person 2x sehari', targetValue: 30, unit: 'hari', category: 'social', priority: 'high' },
        { title: 'Medication Adherence', description: 'Minum obat sesuai resep dokter', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'high' }
      ]
    }

    return { severity, score, analysis, recommendations, tasks }
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'Baik':
        return {
          icon: <Smile className="w-16 h-16" />
        }
      case 'Ringan':
        return {
          icon: <CheckCircle className="w-16 h-16" />
        }
      case 'Sedang':
        return {
          icon: <AlertTriangle className="w-16 h-16" />
        }
      case 'Berat':
        return {
          icon: <AlertCircle className="w-16 h-16" />
        }
      default: // Sangat Berat
        return {
          icon: <AlertCircle className="w-16 h-16" />
        }
    }
  }

  const saveTasksToFirebase = async () => {
    if (!result?.tasks || !currentUserId) {
      alert('Tidak ada tasks untuk disimpan atau user belum login')
      return
    }

    setSavingTasks(true)
    
    try {
      const saveResult = await saveAssessmentTasksToGoals(
        currentUserId,
        result.tasks,
        {
          severity: result.severity,
          story: userStory
        }
      )
      
      if (saveResult.success) {
        alert(`Berhasil menyimpan ${saveResult.count} tasks ke Target & Pencapaian!`)
        router.push('/page/SehatJiwa')
      } else {
        alert(`Gagal menyimpan tasks: ${saveResult.error}`)
      }
    } catch (error) {
      console.error('Error saving tasks:', error)
      alert('Gagal menyimpan tasks. Silakan coba lagi.')
    } finally {
      setSavingTasks(false)
    }
  }

  const resetAssessment = () => {
    setStep('story')
    setUserStory('')
    setQuestions([])
    setCurrentQuestion(0)
    setAnswers({})
    setResult(null)
  }

  if (loading) {
    const loadingMessage = step === 'story' 
      ? 'Menganalisis cerita Anda dan membuat pertanyaan...'
      : 'Menganalisis hasil asesmen Anda...'
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative overflow-hidden">
        <FloatingElements />
        <Navbar />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-12">
            <div className="flex flex-col items-center gap-4">
              <Brain className="w-20 h-20 text-[#1E498E] animate-pulse" />
              <Loader className="w-16 h-16 text-[#1E498E] animate-spin" />
              <p className="text-[#1E498E] text-xl font-bold">{loadingMessage}</p>
              <p className="text-[#1E498E]/70 text-sm">Mohon tunggu sebentar...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    const config = getSeverityConfig(result.severity)
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative overflow-hidden">
        <FloatingElements />
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 mt-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full mb-4">
              <Sparkles className="text-[#1E498E] w-5 h-5" />
              <span className="text-[#1E498E] font-semibold">Hasil Asesmen Kesehatan Mental</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 mb-6"
          >
            {/* Severity Badge */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-[#1E498E] text-white p-6 rounded-full mb-4">
                {config.icon}
              </div>
              <h2 className="text-3xl font-bold text-[#1E498E] mb-2">
                Tingkat: {result.severity}
              </h2>
              <p className="text-gray-600">Skor: {result.score}/{questions.length * 3}</p>
            </div>

            {/* Analysis */}
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/40">
              <h3 className="text-xl font-bold text-[#1E498E] mb-3 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Analisis
              </h3>
              <p className="text-[#1E498E]/90 leading-relaxed">{result.analysis}</p>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#1E498E] mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Rekomendasi
              </h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-[#1E498E] flex-shrink-0 mt-0.5" />
                    <p className="text-[#1E498E]">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tasks/Missions */}
            {result.tasks && result.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#1E498E] mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Target & Mission untuk Anda
                </h3>
                <div className="space-y-3 mb-4">
                  {result.tasks.map((task, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/40 backdrop-blur-sm p-5 rounded-xl border border-white/50 shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#1E498E] text-lg">{task.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority === 'high' ? 'Prioritas Tinggi' :
                           task.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                        </span>
                      </div>
                      <p className="text-[#1E498E]/80 text-sm mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#1E498E]" />
                          <span className="text-[#1E498E]/70">Target: {task.targetValue} {task.unit}</span>
                        </div>
                        <span className="px-2 py-1 bg-[#1E498E]/10 text-[#1E498E] rounded text-xs">
                          {task.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Save Tasks Button */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={saveTasksToFirebase}
                    disabled={savingTasks || !currentUserId}
                    whileHover={!savingTasks && currentUserId ? { scale: 1.02 } : {}}
                    whileTap={!savingTasks && currentUserId ? { scale: 0.98 } : {}}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                      savingTasks || !currentUserId
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-[#1E498E] text-white hover:bg-[#1E498E]/90'
                    }`}
                  >
                    {savingTasks ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        Menyimpan Tasks...
                      </div>
                    ) : !currentUserId ? (
                      'Login untuk Menyimpan Tasks'
                    ) : (
                      <>
                        <Target className="w-5 h-5 inline mr-2" />
                        Simpan ke Target & Pencapaian
                      </>
                    )}
                  </motion.button>
                  
                  {currentUserId && (
                    <Link href="/page/SehatJiwa" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl font-bold text-lg shadow-lg bg-white border-2 border-[#1E498E] text-[#1E498E] hover:bg-[#1E498E]/10 transition-all"
                      >
                        <Brain className="w-5 h-5 inline mr-2" />
                        Lihat Target Saya
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            {result.severity !== 'Baik' && (
              <div className="bg-[#1E498E] text-white p-6 rounded-2xl mb-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Butuh Bantuan Profesional?</h3>
                <p className="mb-4">Konsultasi dengan psikiater kami untuk mendapatkan penanganan yang tepat.</p>
                <Link href="/konsultasi">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-[#1E498E] px-6 py-3 rounded-xl font-semibold shadow-lg"
                  >
                    Jadwalkan Konsultasi
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Reset Button */}
            <motion.button
              onClick={resetAssessment}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border-2 border-[#1E498E] text-[#1E498E] hover:bg-[#1E498E]/10 bg-white/50 backdrop-blur-sm py-3 rounded-xl font-semibold transition-colors"
            >
              Ulangi Asesmen
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Story Input Step
  if (step === 'story') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative overflow-hidden">
        <FloatingElements />
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 mt-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full mb-4">
              <Brain className="text-[#1E498E] w-5 h-5" />
              <span className="text-[#1E498E] font-semibold">AI Asesmen Kesehatan Mental</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30  p-8"
          >

            <h2 className="text-2xl font-bold text-[#1E498E] mb-4 text-center">
              Ceritakan Apa yang Anda Rasakan
            </h2>
            <p className="text-[#1E498E]/70 mb-6 text-center">
              Tuliskan keluh kesah, perasaan, atau masalah yang sedang Anda hadapi. 
              AI kami akan menganalisis cerita Anda dan menghasilkan pertanyaan yang tepat untuk memahami kondisi mental Anda.
            </p>

            <div className="mb-6">
              <label className="block text-[#1E498E] font-semibold mb-3">
                Cerita Anda <span className="text-red-500">*</span>
              </label>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Contoh: Akhir-akhir ini saya merasa sangat tertekan dengan pekerjaan. Saya sering merasa cemas dan sulit tidur. Saya kehilangan minat pada hal-hal yang biasanya saya sukai..."
                className="w-full h-64 p-4 border-2 border-white/30 rounded-2xl focus:border-[#1E498E] focus:ring-2 focus:ring-[#1E498E] focus:outline-none resize-none text-[#1E498E] bg-white/50 backdrop-blur-sm placeholder-[#1E498E]/50"
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-[#1E498E]/70">
                  Minimal 50 karakter untuk hasil yang lebih akurat
                </span>
                <span className="text-sm text-[#1E498E]/70">
                  {userStory.length}/2000
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white/40 backdrop-blur-sm border-2 border-white/50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-[#1E498E] mb-2">💡 Tips untuk cerita yang baik:</h3>
              <ul className="space-y-1 text-sm text-[#1E498E]/80">
                <li>• Jelaskan apa yang Anda rasakan saat ini</li>
                <li>• Ceritakan masalah atau situasi yang membuat Anda khawatir</li>
                <li>• Sebutkan gejala fisik atau emosional yang Anda alami</li>
                <li>• Jujurlah - semua informasi akan dijaga kerahasiaannya</li>
              </ul>
            </div>

            <motion.button
              onClick={handleGenerateQuestions}
              disabled={userStory.length < 50}
              whileHover={userStory.length >= 50 ? { scale: 1.05 } : {}}
              whileTap={userStory.length >= 50 ? { scale: 0.95 } : {}}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-lg mb-12 ${
                userStory.length >= 50
                  ? 'bg-[#1E498E] hover:bg-[#1E498E]/90 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Lanjutkan ke Pertanyaan
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Questions Step
  if (step === 'questions' && questions.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative overflow-hidden">
        <FloatingElements />
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 mt-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full mb-4">
              <Brain className="text-[#1E498E] w-5 h-5" />
              <span className="text-[#1E498E] font-semibold">Pertanyaan Asesmen</span>
            </div>
            <p className="text-[#1E498E]/70">Jawab pertanyaan berdasarkan cerita Anda</p>
          </motion.div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#1E498E]">
                Pertanyaan {currentQuestion + 1} dari {questions.length}
              </span>
              <span className="text-sm text-[#1E498E]/70">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                className="bg-[#1E498E] h-3 rounded-full"
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 mb-6"
            >
              <div className="flex items-start gap-4 mb-8">
                <div className="bg-[#1E498E] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  {currentQuestion + 1}
                </div>
                <h2 className=" text-xl md:text-2xl  font-bold text-[#1E498E] leading-tight">
                  {questions[currentQuestion].text}
                </h2>
              </div>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-5 rounded-2xl text-left text font-semibold transition-all ${
                      answers[questions[currentQuestion].id] === option.value
                        ? 'bg-[#1E498E] text-white shadow-lg'
                        : 'bg-white/40 backdrop-blur-sm text-[#1E498E] border border-white/50 hover:shadow-lg'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4">
            {currentQuestion > 0 && (
              <motion.button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 border-2 border-[#1E498E] text-[#1E498E] hover:bg-[#1E498E]/10 bg-white/50 backdrop-blur-sm py-4 rounded-xl font-semibold transition-colors mb-14"
              >
                Sebelumnya
              </motion.button>
            )}
            
            {currentQuestion === questions.length - 1 && answers[questions[currentQuestion].id] !== undefined && (
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-[#1E498E] hover:bg-[#1E498E]/90 text-white py-4 rounded-xl font-semibold shadow-lg transition-colors mb-14"
              >
                Lihat Hasil Analisis
              </motion.button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
