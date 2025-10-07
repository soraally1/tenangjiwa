import { useState, useEffect, useRef, useCallback } from 'react';
import { enhancedFaceDetectionService } from '@/app/service/enhancedFaceDetectionService';
import { mentalHealthDetectionService, MentalHealthAssessment, EyeTrackingData, BehavioralPatterns } from '@/app/service/mentalHealthDetectionService';
import { EmotionData } from '@/app/service/faceDetectionService';

export const useMentalHealthDetection = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentalHealthAssessment, setMentalHealthAssessment] = useState<MentalHealthAssessment | null>(null);
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingData | null>(null);
  const [behavioralData, setBehavioralData] = useState<BehavioralPatterns | null>(null);

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check model loading status
  useEffect(() => {
    const checkModelStatus = () => {
      const status = enhancedFaceDetectionService.getModelStatus();
      setIsModelLoaded(status.isLoaded);
      
      if (!status.isLoaded) {
        setTimeout(checkModelStatus, 2000);
      }
    };

    const timer = setTimeout(checkModelStatus, 1000);
    return () => clearTimeout(timer);
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded) {
      setError('Model belum dimuat');
      return;
    }

    setIsDetecting(true);
    setError(null);
    enhancedFaceDetectionService.resetSession();

    detectionIntervalRef.current = setInterval(async () => {
      try {
        const result = await enhancedFaceDetectionService.detectFaceAndAnalyze(
          videoElement,
          canvasRef.current || undefined
        );

        setFaceDetected(result.faceDetected);

        if (result.faceDetected && result.emotion && result.confidence) {
          const emotionDef = {
            emotion: result.emotion,
            confidence: result.confidence,
            icon: getEmotionIcon(result.emotion),
            color: getEmotionColor(result.emotion),
            bgGradient: getEmotionGradient(result.emotion)
          };

          setCurrentEmotion(emotionDef);
          setEyeTrackingData(result.eyeTracking || null);
          setBehavioralData(result.behavioral || null);
          
          // Add to emotion history
          setEmotionHistory(prev => {
            const newHistory = [...prev, emotionDef];
            return newHistory.slice(-20);
          });

          // Perform mental health analysis (every 2 seconds to reduce load)
          if (result.eyeTracking && result.behavioral && Date.now() % 2000 < 500) {
            const assessment = mentalHealthDetectionService.analyzeMentalHealth(
              emotionDef,
              result.eyeTracking,
              result.behavioral
            );
            setMentalHealthAssessment(assessment);
          }
        } else {
          setCurrentEmotion(null);
          setEyeTrackingData(null);
          setBehavioralData(null);
        }
      } catch (err) {
        console.error('Mental health detection error:', err);
        setError('Error detecting mental health indicators');
      }
    }, 500); // Detect every 500ms for better responsiveness
  }, [isModelLoaded]);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setFaceDetected(false);
    setCurrentEmotion(null);
    setMentalHealthAssessment(null);
    setEyeTrackingData(null);
    setBehavioralData(null);
  }, []);

  const clearHistory = useCallback(() => {
    setEmotionHistory([]);
    setCurrentEmotion(null);
    setMentalHealthAssessment(null);
    setEyeTrackingData(null);
    setBehavioralData(null);
    mentalHealthDetectionService.clearHistory();
    enhancedFaceDetectionService.resetSession();
  }, []);

  const drawFaceOverlay = useCallback((canvas: HTMLCanvasElement) => {
    if (canvasRef.current) {
      canvasRef.current = canvas;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  return {
    isModelLoaded,
    faceDetected,
    currentEmotion,
    emotionHistory,
    isDetecting,
    error,
    mentalHealthAssessment,
    eyeTrackingData,
    behavioralData,
    startDetection,
    stopDetection,
    clearHistory,
    drawFaceOverlay,
    canvasRef
  };
};

// Helper functions
const getEmotionIcon = (emotion: string) => {
  const iconMap = {
    'Bahagia': '😊',
    'Sedih': '😢',
    'Marah': '😠',
    'Takut': '😨',
    'Jijik': '🤢',
    'Terkejut': '😲',
    'Netral': '😐',
  };
  return iconMap[emotion as keyof typeof iconMap] || '😐';
};

const getEmotionColor = (emotion: string) => {
  const colorMap = {
    'Bahagia': 'bg-green-500',
    'Sedih': 'bg-blue-500',
    'Marah': 'bg-red-500',
    'Takut': 'bg-purple-500',
    'Jijik': 'bg-yellow-500',
    'Terkejut': 'bg-orange-500',
    'Netral': 'bg-gray-500',
  };
  return colorMap[emotion as keyof typeof colorMap] || 'bg-gray-500';
};

const getEmotionGradient = (emotion: string) => {
  const gradientMap = {
    'Bahagia': 'from-green-400/20 to-green-600/20',
    'Sedih': 'from-blue-400/20 to-blue-600/20',
    'Marah': 'from-red-400/20 to-red-600/20',
    'Takut': 'from-purple-400/20 to-purple-600/20',
    'Jijik': 'from-yellow-400/20 to-yellow-600/20',
    'Terkejut': 'from-orange-400/20 to-orange-600/20',
    'Netral': 'from-gray-400/20 to-gray-600/20',
  };
  return gradientMap[emotion as keyof typeof gradientMap] || 'from-gray-400/20 to-gray-600/20';
};
