import * as faceapi from 'face-api.js';
import { EyeTrackingData, BehavioralPatterns } from './mentalHealthDetectionService';

export interface EnhancedFaceDetectionResult {
  faceDetected: boolean;
  emotion?: string;
  confidence?: number;
  boundingBox?: faceapi.FaceDetection;
  landmarks?: faceapi.FaceLandmarks68;
  eyeTracking?: EyeTrackingData;
  behavioral?: BehavioralPatterns;
}

class EnhancedFaceDetectionService {
  private isModelLoaded = false;
  private isInitialized = false;
  private lastBlinkTime = 0;
  private blinkCount = 0;
  private sessionStartTime = Date.now();
  private eyeContactStartTime = 0;
  private totalEyeContactTime = 0;
  private lastGazePosition = { x: 0, y: 0 };
  private gazePositions: Array<{ x: number; y: number; timestamp: number }> = [];
  private headPositions: Array<{ x: number; y: number; timestamp: number }> = [];
  private lastSmileTime = 0;
  private smileCount = 0;
  private lastResponseTime = 0;
  private responseTimes: number[] = [];
  private lastAnalysisTime = 0;
  private cachedEyeTracking: EyeTrackingData | null = null;
  private cachedBehavioral: BehavioralPatterns | null = null;

  constructor() {
    this.initializeEnvironment();
  }

  private initializeEnvironment() {
    if (typeof window !== 'undefined') {
      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img')
      });
      this.isInitialized = true;
      this.loadModels();
    }
  }

  private async loadModels() {
    if (!this.isInitialized) {
      console.log('Environment not initialized yet, skipping model loading');
      return;
    }

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      
      this.isModelLoaded = true;
      console.log('Enhanced face detection models loaded successfully');
    } catch (error) {
      console.error('Error loading enhanced face detection models:', error);
      this.isModelLoaded = false;
    }
  }

  public getModelStatus(): { isLoaded: boolean; progress: number } {
    return {
      isLoaded: this.isModelLoaded,
      progress: this.isModelLoaded ? 1 : 0
    };
  }

  public async detectFaceAndAnalyze(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): Promise<EnhancedFaceDetectionResult> {
    if (!this.isModelLoaded || !this.isInitialized) {
      throw new Error('Models not loaded or not initialized');
    }

    try {
      const currentTime = Date.now();
      
      // Use cached results if analysis was done recently (within 500ms)
      const useCache = currentTime - this.lastAnalysisTime < 500;
      
      if (useCache && this.cachedEyeTracking && this.cachedBehavioral) {
        // Quick emotion detection only
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length === 0) {
          return { faceDetected: false };
        }

        const detection = detections[0];
        const expressions = detection.expressions;
        const emotions = Object.entries(expressions);
        const sortedEmotions = emotions.sort(([, a], [, b]) => b - a);
        const [emotion, confidence] = sortedEmotions[0];

        return {
          faceDetected: true,
          emotion: this.mapEmotionToIndonesian(emotion),
          confidence: confidence,
          boundingBox: detection.detection,
          eyeTracking: this.cachedEyeTracking,
          behavioral: this.cachedBehavioral
        };
      }

      // Full analysis
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        return { faceDetected: false };
      }

      const detection = detections[0];
      const expressions = detection.expressions;
      const landmarks = detection.landmarks;

      // Find the emotion with highest confidence
      const emotions = Object.entries(expressions);
      const sortedEmotions = emotions.sort(([, a], [, b]) => b - a);
      const [emotion, confidence] = sortedEmotions[0];

      // Analyze eye tracking and behavioral patterns
      const eyeTracking = this.analyzeEyeTracking(landmarks, detection.detection);
      const behavioral = this.analyzeBehavioralPatterns(landmarks, detection.detection, emotion);

      // Cache results
      this.cachedEyeTracking = eyeTracking;
      this.cachedBehavioral = behavioral;
      this.lastAnalysisTime = currentTime;

      // Draw overlay if canvas provided
      if (canvasElement) {
        this.drawEnhancedOverlay(canvasElement, videoElement, detections, eyeTracking, behavioral);
      }

      return {
        faceDetected: true,
        emotion: this.mapEmotionToIndonesian(emotion),
        confidence: confidence,
        boundingBox: detection.detection,
        landmarks: landmarks,
        eyeTracking,
        behavioral
      };
    } catch (error) {
      console.error('Error in enhanced face detection:', error);
      return { faceDetected: false };
    }
  }

  private analyzeEyeTracking(landmarks: faceapi.FaceLandmarks68, detection: faceapi.FaceDetection): EyeTrackingData {
    const currentTime = Date.now();
    const sessionDuration = Math.max(0.1, (currentTime - this.sessionStartTime) / 1000 / 60); // minutes

    // Calculate eye landmarks (simplified)
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const eyeCenter = this.calculateEyeCenter(leftEye, rightEye);
    
    // Calculate blink rate (simplified)
    const eyeAspectRatio = this.calculateEyeAspectRatio(leftEye, rightEye);
    const isBlinking = eyeAspectRatio < 0.25;
    
    if (isBlinking && currentTime - this.lastBlinkTime > 200) {
      this.blinkCount++;
      this.lastBlinkTime = currentTime;
    }
    
    const blinkRate = this.blinkCount / sessionDuration;

    // Calculate eye contact duration (simplified)
    const isLookingAtCamera = this.isLookingAtCamera(eyeCenter, detection);
    if (isLookingAtCamera) {
      if (this.eyeContactStartTime === 0) {
        this.eyeContactStartTime = currentTime;
      }
    } else {
      if (this.eyeContactStartTime > 0) {
        this.totalEyeContactTime += currentTime - this.eyeContactStartTime;
        this.eyeContactStartTime = 0;
      }
    }
    
    const eyeContactDuration = Math.min(1, (this.totalEyeContactTime / 1000 / 60) / sessionDuration);

    // Calculate gaze stability (simplified)
    this.gazePositions.push({ x: eyeCenter.x, y: eyeCenter.y, timestamp: currentTime });
    this.gazePositions = this.gazePositions.slice(-10); // Keep only last 10 positions
    
    const gazeStability = this.calculateGazeStability();

    // Simplified calculations for better performance
    const pupilDilation = Math.min(1, eyeAspectRatio * 2);
    const eyeMovementSpeed = this.calculateEyeMovementSpeed();
    const fixationDuration = this.calculateFixationDuration();

    return {
      blinkRate,
      eyeContactDuration,
      gazeStability,
      pupilDilation,
      eyeMovementSpeed,
      fixationDuration
    };
  }

  private analyzeBehavioralPatterns(
    landmarks: faceapi.FaceLandmarks68, 
    detection: faceapi.FaceDetection, 
    emotion: string
  ): BehavioralPatterns {
    const currentTime = Date.now();
    const sessionDuration = Math.max(0.1, (currentTime - this.sessionStartTime) / 1000 / 60); // minutes

    // Calculate smile frequency (simplified)
    if (emotion === 'happy' && currentTime - this.lastSmileTime > 1000) {
      this.smileCount++;
      this.lastSmileTime = currentTime;
    }
    const smileFrequency = this.smileCount / sessionDuration;

    // Calculate head movement (simplified)
    const headCenter = this.calculateHeadCenter(landmarks);
    this.headPositions.push({ x: headCenter.x, y: headCenter.y, timestamp: currentTime });
    this.headPositions = this.headPositions.slice(-10); // Keep only last 10 positions
    
    const headMovement = this.calculateHeadMovement();

    // Simplified calculations for better performance
    const postureStability = this.calculatePostureStability(landmarks);
    const responseTime = this.calculateResponseTime();
    const energyLevel = this.calculateEnergyLevel(landmarks, detection);
    const socialEngagement = this.calculateSocialEngagement(landmarks, emotion);

    return {
      smileFrequency,
      headMovement,
      postureStability,
      responseTime,
      energyLevel,
      socialEngagement
    };
  }

  private calculateEyeCenter(leftEye: faceapi.Point[], rightEye: faceapi.Point[]): { x: number; y: number } {
    const leftCenter = this.calculateCenter(leftEye);
    const rightCenter = this.calculateCenter(rightEye);
    return {
      x: (leftCenter.x + rightCenter.x) / 2,
      y: (leftCenter.y + rightCenter.y) / 2
    };
  }

  private calculateCenter(points: faceapi.Point[]): { x: number; y: number } {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  private calculateEyeAspectRatio(leftEye: faceapi.Point[], rightEye: faceapi.Point[]): number {
    const leftEAR = this.calculateEAR(leftEye);
    const rightEAR = this.calculateEAR(rightEye);
    return (leftEAR + rightEAR) / 2;
  }

  private calculateEAR(eye: faceapi.Point[]): number {
    // Simplified Eye Aspect Ratio calculation
    const vertical1 = this.distance(eye[1], eye[5]);
    const vertical2 = this.distance(eye[2], eye[4]);
    const horizontal = this.distance(eye[0], eye[3]);
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  private distance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private isLookingAtCamera(eyeCenter: { x: number; y: number }, detection: faceapi.FaceDetection): boolean {
    const faceCenter = {
      x: detection.box.x + detection.box.width / 2,
      y: detection.box.y + detection.box.height / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(eyeCenter.x - faceCenter.x, 2) + 
      Math.pow(eyeCenter.y - faceCenter.y, 2)
    );
    
    const threshold = detection.box.width * 0.1;
    return distance < threshold;
  }

  private calculateGazeStability(): number {
    if (this.gazePositions.length < 2) return 1;
    
    // Simplified calculation for better performance
    const last = this.gazePositions[this.gazePositions.length - 1];
    const first = this.gazePositions[0];
    const totalVariation = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    return Math.max(0, 1 - totalVariation / 100); // Normalize to 0-1
  }

  private calculateEyeMovementSpeed(): number {
    if (this.gazePositions.length < 2) return 0;
    
    // Simplified calculation for better performance
    const last = this.gazePositions[this.gazePositions.length - 1];
    const first = this.gazePositions[0];
    const timeDiff = (last.timestamp - first.timestamp) / 1000; // seconds
    
    if (timeDiff <= 0) return 0;
    
    const distance = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    return distance / timeDiff;
  }

  private calculateFixationDuration(): number {
    if (this.gazePositions.length < 2) return 1;
    
    // Simplified calculation for better performance
    const last = this.gazePositions[this.gazePositions.length - 1];
    const first = this.gazePositions[0];
    const totalTime = last.timestamp - first.timestamp;
    
    if (totalTime <= 0) return 1;
    
    // Simple approximation based on gaze stability
    const gazeStability = this.calculateGazeStability();
    return Math.max(0.1, gazeStability);
  }

  private calculateHeadCenter(landmarks: faceapi.FaceLandmarks68): { x: number; y: number } {
    const nose = landmarks.getNose();
    return this.calculateCenter(nose);
  }

  private calculateHeadMovement(): number {
    if (this.headPositions.length < 2) return 0;
    
    // Simplified calculation for better performance
    const last = this.headPositions[this.headPositions.length - 1];
    const first = this.headPositions[0];
    const totalMovement = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    return totalMovement / (this.headPositions.length - 1);
  }

  private calculatePostureStability(landmarks: faceapi.FaceLandmarks68): number {
    // Simplified posture stability based on face angle
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = this.calculateCenter(leftEye);
    const rightEyeCenter = this.calculateCenter(rightEye);
    const noseCenter = this.calculateCenter(nose);
    
    const eyeCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2
    };
    
    const angle = Math.atan2(noseCenter.y - eyeCenter.y, noseCenter.x - eyeCenter.x);
    const stability = Math.abs(Math.cos(angle)); // 1 = perfectly upright, 0 = tilted
    
    return stability;
  }

  private calculateResponseTime(): number {
    if (this.responseTimes.length === 0) return 1;
    
    const averageResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    return Math.min(1, averageResponseTime / 2); // Normalize to 0-1
  }

  private calculateEnergyLevel(landmarks: faceapi.FaceLandmarks68, detection: faceapi.FaceDetection): number {
    // Calculate energy based on facial expression intensity and movement
    const mouth = landmarks.getMouth();
    const mouthOpenness = this.calculateMouthOpenness(mouth);
    
    const eyeOpenness = this.calculateEyeAspectRatio(
      landmarks.getLeftEye(), 
      landmarks.getRightEye()
    );
    
    const faceSize = detection.box.width * detection.box.height;
    const normalizedSize = Math.min(1, faceSize / 100000); // Normalize face size
    
    return (mouthOpenness + eyeOpenness + normalizedSize) / 3;
  }

  private calculateMouthOpenness(mouth: faceapi.Point[]): number {
    const topLip = mouth[3];
    const bottomLip = mouth[9];
    const verticalDistance = Math.abs(bottomLip.y - topLip.y);
    return Math.min(1, verticalDistance / 20); // Normalize
  }

  private calculateSocialEngagement(landmarks: faceapi.FaceLandmarks68, emotion: string): number {
    // Calculate social engagement based on facial features and emotion
    const mouth = landmarks.getMouth();
    const mouthOpenness = this.calculateMouthOpenness(mouth);
    
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const eyeOpenness = this.calculateEyeAspectRatio(leftEye, rightEye);
    
    const emotionEngagement = emotion === 'happy' ? 1 : 
                            emotion === 'sad' ? 0.3 : 
                            emotion === 'neutral' ? 0.5 : 0.7;
    
    return (mouthOpenness + eyeOpenness + emotionEngagement) / 3;
  }

  private mapEmotionToIndonesian(emotion: string): string {
    const emotionMap: { [key: string]: string } = {
      'happy': 'Bahagia',
      'sad': 'Sedih',
      'angry': 'Marah',
      'fearful': 'Takut',
      'disgusted': 'Jijik',
      'surprised': 'Terkejut',
      'neutral': 'Netral'
    };
    return emotionMap[emotion] || 'Netral';
  }

  private drawEnhancedOverlay(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    detections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }, faceapi.FaceLandmarks68>>[],
    eyeTracking: EyeTrackingData,
    behavioral: BehavioralPatterns
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(detection => {
      const { x, y, width, height } = detection.detection.box;
      
      // Draw bounding box with color based on mental health indicators
      const riskColor = this.getRiskColor(eyeTracking, behavioral);
      ctx.strokeStyle = riskColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw landmarks
      const landmarks = detection.landmarks;
      ctx.fillStyle = riskColor;
      landmarks.positions.forEach((point: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw mental health indicators
      this.drawMentalHealthIndicators(ctx, x, y, eyeTracking, behavioral);
    });
  }

  private getRiskColor(eyeTracking: EyeTrackingData, behavioral: BehavioralPatterns): string {
    // Simple risk assessment based on key indicators
    const riskFactors = [
      eyeTracking.eyeContactDuration < 0.3 ? 1 : 0,
      eyeTracking.blinkRate < 8 ? 1 : 0,
      behavioral.smileFrequency < 0.5 ? 1 : 0,
      behavioral.socialEngagement < 0.3 ? 1 : 0
    ];
    
    const riskScore = riskFactors.reduce((sum, factor) => sum + factor, 0);
    
    if (riskScore >= 3) return '#ff4444'; // High risk - red
    if (riskScore >= 2) return '#ffaa44'; // Medium risk - orange
    if (riskScore >= 1) return '#ffff44'; // Low risk - yellow
    return '#44ff44'; // No risk - green
  }

  private drawMentalHealthIndicators(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    eyeTracking: EyeTrackingData,
    behavioral: BehavioralPatterns
  ) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    
    const indicators = [
      `Eye Contact: ${Math.round(eyeTracking.eyeContactDuration * 100)}%`,
      `Blink Rate: ${Math.round(eyeTracking.blinkRate)}/min`,
      `Smile Freq: ${Math.round(behavioral.smileFrequency * 10)}/min`,
      `Engagement: ${Math.round(behavioral.socialEngagement * 100)}%`
    ];
    
    indicators.forEach((indicator, index) => {
      ctx.fillText(indicator, x, y - 60 + (index * 15));
    });
  }

  public resetSession(): void {
    this.lastBlinkTime = 0;
    this.blinkCount = 0;
    this.sessionStartTime = Date.now();
    this.eyeContactStartTime = 0;
    this.totalEyeContactTime = 0;
    this.gazePositions = [];
    this.headPositions = [];
    this.lastSmileTime = 0;
    this.smileCount = 0;
    this.responseTimes = [];
  }
}

export const enhancedFaceDetectionService = new EnhancedFaceDetectionService();
