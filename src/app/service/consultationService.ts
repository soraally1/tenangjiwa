import { db } from './firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'

export interface Consultation {
  id: string
  userId: string
  doctorId: string
  doctorName: string
  status: 'scheduled' | 'started' | 'completed' | 'cancelled'
  scheduledDate: Date
  scheduledTime: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  orderId?: string
  amount?: number
}

export interface ChatMessage {
  id: string
  consultationId: string
  senderId: string
  senderType: 'user' | 'doctor'
  message: string
  timestamp: Date
  isRead: boolean
}

/**
 * Create a new consultation
 */
export async function createConsultation(
  userId: string,
  doctorId: string,
  doctorName: string,
  scheduledDate: Date,
  scheduledTime: string,
  orderId?: string,
  amount?: number
): Promise<{ success: boolean; consultationId?: string; error?: string }> {
  try {
    console.log('Creating consultation in Firestore with data:', {
      userId,
      doctorId,
      doctorName,
      status: 'scheduled',
      scheduledDate,
      scheduledTime,
      orderId,
      amount
    })

    const consultationData = {
      userId,
      doctorId,
      doctorName,
      status: 'scheduled' as const,
      scheduledDate,
      scheduledTime,
      createdAt: serverTimestamp(),
      orderId,
      amount
    }

    console.log('Creating consultation with data:', consultationData)

    const docRef = await addDoc(collection(db, 'consultations'), consultationData)
    
    console.log('Consultation created successfully with ID:', docRef.id)
    
    // Verify the consultation was created correctly
    const createdDoc = await getDoc(docRef)
    if (createdDoc.exists()) {
      console.log('Verified consultation data:', createdDoc.data())
    }
    
    return { 
      success: true, 
      consultationId: docRef.id 
    }
  } catch (error) {
    console.error('Error creating consultation:', error)
    console.error('Error details:', {
      code: error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : 'unknown',
      message: error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'unknown',
      details: error
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Start a consultation (doctor only)
 */
export async function startConsultation(
  consultationId: string,
  doctorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting consultation:', { consultationId, doctorId })
    
    const consultationRef = doc(db, 'consultations', consultationId)
    const consultationDoc = await getDoc(consultationRef)
    
    if (!consultationDoc.exists()) {
      console.log('Consultation not found:', consultationId)
      return { success: false, error: 'Consultation not found' }
    }
    
    const consultation = consultationDoc.data()
    console.log('Current consultation data:', consultation)
    
    // Verify doctor owns this consultation
    if (consultation.doctorId !== doctorId) {
      console.log('Unauthorized doctor:', { expected: consultation.doctorId, actual: doctorId })
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if consultation is scheduled
    if (consultation.status !== 'scheduled') {
      console.log('Consultation cannot be started, current status:', consultation.status)
      return { success: false, error: `Consultation cannot be started. Current status: ${consultation.status}` }
    }
    
    console.log('Updating consultation status to started...')
    await updateDoc(consultationRef, {
      status: 'started',
      startedAt: serverTimestamp()
    })
    
    console.log('Consultation started successfully')
    return { success: true }
  } catch (error) {
    console.error('Error starting consultation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Complete a consultation (doctor only)
 */
export async function completeConsultation(
  consultationId: string,
  doctorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const consultationRef = doc(db, 'consultations', consultationId)
    const consultationDoc = await getDoc(consultationRef)
    
    if (!consultationDoc.exists()) {
      return { success: false, error: 'Consultation not found' }
    }
    
    const consultation = consultationDoc.data()
    
    // Verify doctor owns this consultation
    if (consultation.doctorId !== doctorId) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if consultation is started
    if (consultation.status !== 'started') {
      return { success: false, error: 'Consultation is not active' }
    }
    
    await updateDoc(consultationRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error completing consultation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get consultation by ID
 */
export async function getConsultation(consultationId: string): Promise<Consultation | null> {
  try {
    const consultationDoc = await getDoc(doc(db, 'consultations', consultationId))
    
    if (!consultationDoc.exists()) {
      return null
    }
    
    const data = consultationDoc.data()
    return {
      id: consultationDoc.id,
      userId: data.userId,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      status: data.status,
      scheduledDate: data.scheduledDate?.toDate() || new Date(),
      scheduledTime: data.scheduledTime,
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      orderId: data.orderId,
      amount: data.amount
    }
  } catch (error) {
    console.error('Error getting consultation:', error)
    return null
  }
}

/**
 * Get consultations for user
 */
export async function getUserConsultations(userId: string): Promise<Consultation[]> {
  try {
    const q = query(
      collection(db, 'consultations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const consultations: Consultation[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      consultations.push({
        id: doc.id,
        userId: data.userId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        status: data.status,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        scheduledTime: data.scheduledTime,
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        orderId: data.orderId,
        amount: data.amount
      })
    })
    
    return consultations
  } catch (error) {
    console.error('Error getting user consultations:', error)
    return []
  }
}

/**
 * Get consultations for doctor
 */
export async function getDoctorConsultations(doctorId: string): Promise<Consultation[]> {
  try {
    const q = query(
      collection(db, 'consultations'),
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const consultations: Consultation[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      consultations.push({
        id: doc.id,
        userId: data.userId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        status: data.status,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        scheduledTime: data.scheduledTime,
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        orderId: data.orderId,
        amount: data.amount
      })
    })
    
    return consultations
  } catch (error) {
    console.error('Error getting doctor consultations:', error)
    return []
  }
}

/**
 * Send a chat message
 */
export async function sendMessage(
  consultationId: string,
  senderId: string,
  senderType: 'user' | 'doctor',
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if consultation exists and is active
    const consultation = await getConsultation(consultationId)
    
    if (!consultation) {
      return { success: false, error: 'Consultation not found' }
    }
    
    // Only allow messages if consultation is started
    if (consultation.status !== 'started') {
      return { success: false, error: 'Consultation is not active' }
    }
    
    // Verify sender is part of this consultation
    if (senderType === 'user' && consultation.userId !== senderId) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (senderType === 'doctor' && consultation.doctorId !== senderId) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const messageData = {
      consultationId,
      senderId,
      senderType,
      message,
      timestamp: serverTimestamp(),
      isRead: false
    }
    
    await addDoc(collection(db, 'chatMessages'), messageData)
    
    return { success: true }
  } catch (error) {
    console.error('Error sending message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get chat messages for a consultation
 */
export async function getChatMessages(consultationId: string): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, 'chatMessages'),
      where('consultationId', '==', consultationId),
      orderBy('timestamp', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    const messages: ChatMessage[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        consultationId: data.consultationId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        timestamp: data.timestamp?.toDate() || new Date(),
        isRead: data.isRead
      })
    })
    
    return messages
  } catch (error) {
    console.error('Error getting chat messages:', error)
    return []
  }
}

/**
 * Listen to consultation status changes
 */
export function listenToConsultation(
  consultationId: string,
  callback: (consultation: Consultation | null) => void
) {
  const consultationRef = doc(db, 'consultations', consultationId)
  
  return onSnapshot(consultationRef, (doc) => {
    console.log('Consultation snapshot received:', { exists: doc.exists(), id: doc.id })
    
    if (doc.exists()) {
      const data = doc.data()
      console.log('Consultation data from snapshot:', data)
      
      const consultation: Consultation = {
        id: doc.id,
        userId: data.userId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        status: data.status,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        scheduledTime: data.scheduledTime,
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        orderId: data.orderId,
        amount: data.amount
      }
      
      console.log('Parsed consultation object:', consultation)
      callback(consultation)
    } else {
      console.log('Consultation document does not exist')
      callback(null)
    }
  })
}

/**
 * Listen to chat messages
 */
export function listenToChatMessages(
  consultationId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, 'chatMessages'),
    where('consultationId', '==', consultationId),
    orderBy('timestamp', 'asc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const messages: ChatMessage[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        consultationId: data.consultationId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        timestamp: data.timestamp?.toDate() || new Date(),
        isRead: data.isRead
      })
    })
    
    callback(messages)
  })
}
