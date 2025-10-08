"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Trophy,
  Star,
  Flame,
  CheckCircle,
  Edit3,
  Trash2,
  Heart,
  Brain,
  Zap,
  Crown,
  BarChart3,
  Users,
  BookOpen
} from 'lucide-react'
import Navbar from '@/app/component/navbar'
import { auth } from '@/app/service/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { loadUserGoals, updateGoalProgress, deleteGoal, calculateUserStats, type Goal } from '@/app/service/goalService'

// Types imported from goalService

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  points: number
  unlockedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserStats {
  totalPoints: number
  level: number
  streak: number
  completedGoals: number
  activeGoals: number
  achievements: Achievement[]
  weeklyProgress: number[]
  monthlyProgress: number[]
}

const CATEGORIES = {
  'mental-health': { name: 'Kesehatan Mental', color: 'bg-pink-500', icon: <Brain className="w-5 h-5" /> },
  'productivity': { name: 'Produktivitas', color: 'bg-blue-500', icon: <Zap className="w-5 h-5" /> },
  'wellness': { name: 'Kesehatan', color: 'bg-green-500', icon: <Heart className="w-5 h-5" /> },
  'learning': { name: 'Pembelajaran', color: 'bg-purple-500', icon: <BookOpen className="w-5 h-5" /> },
  'social': { name: 'Sosial', color: 'bg-orange-500', icon: <Users className="w-5 h-5" /> },
  'personal': { name: 'Personal', color: 'bg-indigo-500', icon: <Target className="w-5 h-5" /> }
}

const PRIORITY_COLORS = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-red-400'
}

const RARITY_COLORS = {
  common: 'bg-gray-400',
  rare: 'bg-blue-400',
  epic: 'bg-purple-400',
  legendary: 'bg-yellow-400'
}

export default function TargetPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1250,
    level: 8,
    streak: 12,
    completedGoals: 15,
    activeGoals: 5,
    achievements: [],
    weeklyProgress: [20, 35, 28, 45, 52, 38, 42],
    monthlyProgress: [120, 135, 128, 145, 152, 138, 142, 155, 148, 162, 158, 165]
  })
  const [viewMode, setViewMode] = useState<'goals' | 'achievements' | 'stats'>('goals')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load goals from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid)
        await loadGoalsFromFirebase(user.uid)
      } else {
        setCurrentUserId(null)
        setGoals([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadGoalsFromFirebase = async (userId: string) => {
    try {
      const loadedGoals = await loadUserGoals(userId)
      setGoals(loadedGoals)
      
      // Update stats using the service
      const stats = await calculateUserStats(userId)
      setUserStats(prev => ({
        ...prev,
        ...stats
      }))
    } catch (error) {
      console.error('Error loading goals:', error)
    }
  }

  // Keep sample data as fallback
  useEffect(() => {
    if (!currentUserId && !loading) {
      const sampleGoals: Goal[] = [
      {
        id: '1',
        userId: 'sample-user',
        title: 'Meditasi Harian',
        description: 'Melakukan meditasi 10 menit setiap hari untuk kesehatan mental',
        category: 'mental-health',
        targetValue: 30,
        currentValue: 18,
        unit: 'hari',
        deadline: new Date('2024-02-15'),
        priority: 'high',
        status: 'active',
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        userId: 'sample-user',
        title: 'Olahraga Rutin',
        description: 'Berolahraga 3 kali seminggu untuk menjaga kebugaran',
        category: 'wellness',
        targetValue: 12,
        currentValue: 8,
        unit: 'sessions',
        deadline: new Date('2024-02-28'),
        priority: 'medium',
        status: 'active',
        createdAt: new Date('2024-01-10')
      },
      {
        id: '3',
        userId: 'sample-user',
        title: 'Membaca Buku',
        description: 'Menyelesaikan 5 buku dalam sebulan',
        category: 'learning',
        targetValue: 5,
        currentValue: 5,
        unit: 'buku',
        deadline: new Date('2024-01-31'),
        priority: 'low',
        status: 'completed',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-30')
      }
    ]

    const sampleAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Pemula',
        description: 'Menyelesaikan goal pertama',
        icon: <Trophy className="w-6 h-6" />,
        points: 100,
        unlockedAt: new Date('2024-01-15'),
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Konsisten',
        description: 'Menjaga streak 7 hari',
        icon: <Flame className="w-6 h-6" />,
        points: 200,
        unlockedAt: new Date('2024-01-20'),
        rarity: 'rare'
      },
      {
        id: '3',
        title: 'Pencapaian Besar',
        description: 'Menyelesaikan 10 goals',
        icon: <Crown className="w-6 h-6" />,
        points: 500,
        unlockedAt: new Date('2024-01-25'),
        rarity: 'epic'
      }
    ]

      setGoals(sampleGoals)
      setUserStats(prev => ({ ...prev, achievements: sampleAchievements }))
    }
  }, [currentUserId, loading])

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  }

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getLevelProgress = () => {
    const currentLevelPoints = userStats.level * 200
    const nextLevelPoints = (userStats.level + 1) * 200
    const progress = ((userStats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    return Math.min(progress, 100)
  }


  const handleUpdateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const result = await updateGoalProgress(goalId, newValue)
      
      if (result.success) {
        if (result.completed) {
          // Award points for completion
          setUserStats(prevStats => ({
            ...prevStats,
            totalPoints: prevStats.totalPoints + 100,
            completedGoals: prevStats.completedGoals + 1,
            activeGoals: prevStats.activeGoals - 1
          }))
        }
        
        // Reload goals from Firebase
        if (currentUserId) {
          await loadGoalsFromFirebase(currentUserId)
        }
      } else {
        alert(`Gagal mengupdate goal: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Gagal mengupdate goal')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus goal ini?')) return
    
    try {
      const result = await deleteGoal(goalId)
      
      if (result.success) {
        // Reload goals from Firebase
        if (currentUserId) {
          await loadGoalsFromFirebase(currentUserId)
        }
      } else {
        alert(`Gagal menghapus goal: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Gagal menghapus goal')
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B3E5FC] via-[#FFF3E0] to-[#B3E5FC] relative overflow-hidden">
      <Navbar />
      
      {/* Background decorations */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-[#1E498E]/10 rounded-full blur-xl"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-48 h-48 bg-[#FFF3E0]/30 rounded-full blur-xl"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="pt-20 pb-24 sm:pb-10">
        <motion.div 
          className="container mx-auto px-4 max-w-7xl" 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
        >
          {/* Header Section */}
          <motion.div className="text-center mb-8 sm:mb-12" variants={itemVariants}>
            <motion.div
              className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Target className="text-[#1E498E] w-5 h-5" />
              <span className="text-[#1E498E] font-semibold">Target & Pencapaian</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E498E] mb-4 sm:mb-6 leading-tight">
              Yuk Rubah Diri Kamu
              <span className="block bg-gradient-to-r from-[#1E498E] to-[#3B82F6] bg-clip-text text-transparent">
                Agar Dapat Menjadi Lebih Baik!
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[#1E498E]/70 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Kelola target kesehatan kamu dan pencapaian dengan sistem gamifikasi yang menyenangkan. 
              Dapatkan poin, badge, dan tingkatkan level Anda!
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12" variants={itemVariants}>
            {/* Level Card */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1E498E] to-[#3B82F6] rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#1E498E]">Level {userStats.level}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#1E498E]/70">
                  <span>Progress</span>
                  <span>{Math.round(getLevelProgress())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-[#1E498E] to-[#3B82F6] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getLevelProgress()}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <p className="text-xs text-[#1E498E]/60">{userStats.totalPoints} poin</p>
              </div>
            </div>

            {/* Points Card */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#1E498E]">{userStats.totalPoints}</span>
              </div>
              <p className="text-[#1E498E]/70 text-xs sm:text-sm">Total Poin</p>
            </div>

            {/* Streak Card */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#1E498E]">{userStats.streak}</span>
              </div>
              <p className="text-[#1E498E]/70 text-xs sm:text-sm">Hari Streak</p>
            </div>

            {/* Goals Card */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#1E498E]">{userStats.completedGoals}</span>
              </div>
              <p className="text-[#1E498E]/70 text-xs sm:text-sm">Goals Selesai</p>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div className="flex justify-center mb-6 sm:mb-8 px-4" variants={itemVariants}>
            <div className="bg-white/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-1 sm:p-2 border border-white/30 w-full sm:w-auto">
              <div className="flex gap-1 sm:gap-2">
                {[
                  { id: 'goals', label: 'Goals', shortLabel: 'Goals', icon: <Target className="w-3 h-3 sm:w-4 sm:h-4" /> },
                  { id: 'achievements', label: 'Achievements', shortLabel: 'Badges', icon: <Trophy className="w-3 h-3 sm:w-4 sm:h-4" /> },
                  { id: 'stats', label: 'Statistik', shortLabel: 'Stats', icon: <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" /> }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id as 'goals' | 'achievements' | 'stats')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all flex-1 sm:flex-initial justify-center ${
                      viewMode === tab.id
                        ? 'bg-[#1E498E] text-white shadow-lg'
                        : 'text-[#1E498E] hover:bg-white/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.icon}
                    <span className="text-xs sm:text-sm">
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {viewMode === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Goals List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {goals.map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-4 sm:p-6 hover:shadow-3xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${CATEGORIES[goal.category].color} rounded-full flex items-center justify-center text-white`}>
                            {CATEGORIES[goal.category].icon}
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#1E498E]">{goal.title}</h3>
                            <p className="text-[#1E498E]/70 text-xs sm:text-sm">{CATEGORIES[goal.category].name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${PRIORITY_COLORS[goal.priority]} rounded-full`} />
                          <span className="text-xs text-[#1E498E]/70 capitalize">{goal.priority}</span>
                        </div>
                      </div>

                      <p className="text-[#1E498E]/80 mb-3 sm:mb-4 text-xs sm:text-sm">{goal.description}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-[#1E498E]/70 mb-2">
                          <span>Progress</span>
                          <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            className="bg-gradient-to-r from-[#1E498E] to-[#3B82F6] h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage(goal)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-[#1E498E]/60 mt-1">
                          <span>{Math.round(getProgressPercentage(goal))}%</span>
                          <span>{getDaysRemaining(goal.deadline)} hari tersisa</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <motion.button
                            onClick={() => handleUpdateGoalProgress(goal.id, Math.min(goal.currentValue + 1, goal.targetValue))}
                            className="bg-green-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            +1
                          </motion.button>
                          <motion.button
                            onClick={() => {/* TODO: Implement edit goal functionality */}}
                            className="bg-blue-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="bg-red-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.button>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status === 'completed' ? 'Selesai' : 
                           goal.status === 'active' ? 'Aktif' : 'Paused'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {viewMode === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1E498E] mb-2 sm:mb-4">Achievements & Badges</h2>
                  <p className="text-[#1E498E]/70 text-sm sm:text-base px-4 sm:px-0">Koleksi pencapaian dan badge yang telah Anda raih</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {userStats.achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-4 sm:p-6 hover:shadow-3xl transition-all"
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 ${RARITY_COLORS[achievement.rarity]} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                          {achievement.icon}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1E498E] mb-1 sm:mb-2">{achievement.title}</h3>
                        <p className="text-[#1E498E]/70 text-xs sm:text-sm mb-3 sm:mb-4">{achievement.description}</p>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium text-[#1E498E]">{achievement.points} poin</span>
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                          achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                          achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                          achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {achievement.rarity.toUpperCase()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {viewMode === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1E498E] mb-2 sm:mb-4">Statistik & Progress</h2>
                  <p className="text-[#1E498E]/70 text-sm sm:text-base px-4 sm:px-0">Lihat perkembangan dan pencapaian Anda</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Weekly Progress Chart */}
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1E498E] mb-3 sm:mb-4">Progress Mingguan</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {userStats.weeklyProgress.map((value, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-4">
                          <span className="text-xs sm:text-sm text-[#1E498E]/70 w-10 sm:w-12">Hari {index + 1}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3">
                            <motion.div
                              className="bg-gradient-to-r from-[#1E498E] to-[#3B82F6] h-2 sm:h-3 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-[#1E498E] w-8 sm:w-12">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Progress Chart */}
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1E498E] mb-3 sm:mb-4">Progress Bulanan</h3>
                    <div className="h-48 sm:h-64 flex items-end gap-1 sm:gap-2">
                      {userStats.monthlyProgress.map((value, index) => (
                        <motion.div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-[#1E498E] to-[#3B82F6] rounded-t"
                          initial={{ height: 0 }}
                          animate={{ height: `${(value / 200) * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.05 }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-[#1E498E]/70 mt-2">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span>Sep</span>
                      <span>Nov</span>
                      <span>Dec</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
