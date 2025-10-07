import { db } from './firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

export interface Goal {
  id: string
  userId: string
  title: string
  description: string
  category: 'mental-health' | 'productivity' | 'wellness' | 'learning' | 'social' | 'personal'
  targetValue: number
  currentValue: number
  unit: string
  deadline: Date
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  createdAt: Date
  completedAt?: Date
  source?: 'mental-assessment' | 'manual'
  assessmentData?: {
    severity: string
    analysisDate: Date
    story: string
  }
}

export interface Task {
  title: string
  description: string
  targetValue: number
  unit: string
  category: 'mental-health' | 'productivity' | 'wellness' | 'learning' | 'social' | 'personal'
  priority: 'low' | 'medium' | 'high'
}

/**
 * Save tasks from mental assessment to Firebase as goals
 */
export async function saveAssessmentTasksToGoals(
  userId: string,
  tasks: Task[],
  assessmentData?: {
    severity: string
    story: string
  }
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const goalsRef = collection(db, 'goals')
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30) // Default 30 days
    
    let savedCount = 0
    
    for (const task of tasks) {
      await addDoc(goalsRef, {
        userId,
        title: task.title,
        description: task.description,
        category: task.category,
        targetValue: task.targetValue,
        currentValue: 0,
        unit: task.unit,
        deadline,
        priority: task.priority,
        status: 'active',
        createdAt: serverTimestamp(),
        source: 'mental-assessment',
        assessmentData: assessmentData ? {
          severity: assessmentData.severity,
          analysisDate: new Date(),
          story: assessmentData.story
        } : null
      })
      savedCount++
    }
    
    return { success: true, count: savedCount }
  } catch (error) {
    console.error('Error saving assessment tasks:', error)
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Load all goals for a specific user
 */
export async function loadUserGoals(userId: string): Promise<Goal[]> {
  try {
    const goalsRef = collection(db, 'goals')
    const q = query(goalsRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const goals: Goal[] = []
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      goals.push({
        id: docSnapshot.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit,
        deadline: data.deadline?.toDate() || new Date(),
        priority: data.priority,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        source: data.source,
        assessmentData: data.assessmentData ? {
          severity: data.assessmentData.severity,
          analysisDate: data.assessmentData.analysisDate?.toDate() || new Date(),
          story: data.assessmentData.story
        } : undefined
      })
    })
    
    return goals
  } catch (error) {
    console.error('Error loading goals:', error)
    return []
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  newValue: number
): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  try {
    const goalRef = doc(db, 'goals', goalId)
    
    const updateData: Record<string, number | string | object> = { currentValue: newValue }
    
    // Check if goal should be marked as completed
    const goalsQuery = await getDocs(query(collection(db, 'goals'), where('__name__', '==', goalId)))
    let shouldComplete = false
    
    goalsQuery.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      if (newValue >= data.targetValue && data.status === 'active') {
        shouldComplete = true
        updateData.status = 'completed'
        updateData.completedAt = serverTimestamp()
      }
    })
    
    await updateDoc(goalRef, updateData)
    
    return { success: true, completed: shouldComplete }
  } catch (error) {
    console.error('Error updating goal:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const goalRef = doc(db, 'goals', goalId)
    await deleteDoc(goalRef)
    return { success: true }
  } catch (error) {
    console.error('Error deleting goal:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get goals from mental assessment only
 */
export async function getAssessmentGoals(userId: string): Promise<Goal[]> {
  try {
    const goalsRef = collection(db, 'goals')
    const q = query(
      goalsRef, 
      where('userId', '==', userId),
      where('source', '==', 'mental-assessment')
    )
    const querySnapshot = await getDocs(q)
    
    const goals: Goal[] = []
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      goals.push({
        id: docSnapshot.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit,
        deadline: data.deadline?.toDate() || new Date(),
        priority: data.priority,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        source: data.source,
        assessmentData: data.assessmentData ? {
          severity: data.assessmentData.severity,
          analysisDate: data.assessmentData.analysisDate?.toDate() || new Date(),
          story: data.assessmentData.story
        } : undefined
      })
    })
    
    return goals
  } catch (error) {
    console.error('Error loading assessment goals:', error)
    return []
  }
}

/**
 * Calculate user stats based on goals
 */
export async function calculateUserStats(userId: string) {
  try {
    const goals = await loadUserGoals(userId)
    
    const completedGoals = goals.filter(g => g.status === 'completed').length
    const activeGoals = goals.filter(g => g.status === 'active').length
    const totalPoints = completedGoals * 100 // 100 points per completed goal
    const level = Math.floor(totalPoints / 200) + 1
    
    // Calculate streak (simplified - you can enhance this)
    const streak = 0 // TODO: Implement streak calculation
    
    return {
      totalPoints,
      level,
      streak,
      completedGoals,
      activeGoals
    }
  } catch (error) {
    console.error('Error calculating stats:', error)
    return {
      totalPoints: 0,
      level: 1,
      streak: 0,
      completedGoals: 0,
      activeGoals: 0
    }
  }
}
