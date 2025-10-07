import { useState, useRef, useCallback, useEffect } from 'react'
import { faceDetectionService, EmotionData } from '../service/faceDetectionService';

export const useFaceDetection = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check model loading status
  useEffect(() => {
    const checkModelStatus = () => {
      const status = faceDetectionService.getModelStatus();
      setIsModelLoaded(status.isLoaded);
      
      if (!status.isLoaded) {
        // Retry after 2 seconds
        setTimeout(checkModelStatus, 2000);
      }
    };

    // Start checking after a short delay to allow environment initialization
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

    // Start detection loop
    detectionIntervalRef.current = setInterval(async () => {
      try {
        const result = await faceDetectionService.detectFaceAndEmotion(
          videoElement,
          canvasRef.current || undefined
        );

        setFaceDetected(result.faceDetected);

        if (result.faceDetected && result.emotion && result.confidence) {
          const emotionDef = faceDetectionService.getEmotionDefinition(result.emotion);
          
          if (emotionDef) {
            const emotionData: EmotionData = {
              ...emotionDef,
              confidence: result.confidence
            };

            setCurrentEmotion(emotionData);
            
            // Add to history
            setEmotionHistory(prev => {
              const newHistory = [...prev, emotionData];
              return newHistory.slice(-10); // Keep only last 10 emotions
            });
          }
        } else {
          setCurrentEmotion(null);
        }
      } catch (err) {
        console.error('Detection error:', err);
        setError('Error detecting face');
      }
    }, 1000); // Detect every second
  }, [isModelLoaded]);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setFaceDetected(false);
    setCurrentEmotion(null);
  }, []);

  const clearHistory = useCallback(() => {
    setEmotionHistory([]);
    setCurrentEmotion(null);
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
    startDetection,
    stopDetection,
    clearHistory,
    drawFaceOverlay,
    canvasRef
  };
};
