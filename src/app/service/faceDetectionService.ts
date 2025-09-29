import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  faceDetected: boolean;
  emotion?: string;
  confidence?: number;
  boundingBox?: faceapi.FaceDetection;
  landmarks?: faceapi.FaceLandmarks68;
}

export interface EmotionData {
  emotion: string;
  confidence: number;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

class FaceDetectionService {
  private isModelLoaded = false;
  private isInitialized = false;

  constructor() {
    this.initializeEnvironment();
  }

  private initializeEnvironment() {
    if (typeof window !== 'undefined') {
      // Set up face-api.js environment for browser
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
      // Load face-api.js models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      
      this.isModelLoaded = true;
      console.log('Face-api.js models loaded successfully');
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      this.isModelLoaded = false;
    }
  }

  public getModelStatus(): { isLoaded: boolean; progress: number } {
    return {
      isLoaded: this.isModelLoaded,
      progress: this.isModelLoaded ? 1 : 0
    };
  }

  public async detectFaceAndEmotion(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): Promise<FaceDetectionResult> {
    if (!this.isModelLoaded) {
      throw new Error('Models not loaded yet');
    }

    if (!this.isInitialized) {
      throw new Error('Face-api.js not initialized');
    }

    try {
      // Detect faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        return {
          faceDetected: false
        };
      }

      // Get the first (largest) face
      const detection = detections[0];
      const expressions = detection.expressions;

      // Find the emotion with highest confidence
      const emotions = Object.entries(expressions);
      const sortedEmotions = emotions.sort(([, a], [, b]) => b - a);
      const [emotion, confidence] = sortedEmotions[0];

      // Draw face overlay on canvas if provided
      if (canvasElement) {
        this.drawFaceOverlay(canvasElement, videoElement, detections as unknown as Array<{
          detection: { box: { x: number; y: number; width: number; height: number } };
          landmarks: { positions: Array<{ x: number; y: number }> };
          expressions: Record<string, number>;
        }>);
      }

      return {
        faceDetected: true,
        emotion: this.mapEmotionToIndonesian(emotion),
        confidence: confidence,
        boundingBox: detection.detection,
        landmarks: detection.landmarks
      };
    } catch (error) {
      console.error('Error detecting face:', error);
      return {
        faceDetected: false
      };
    }
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

  private drawFaceOverlay(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    detections: Array<{
      detection: { box: { x: number; y: number; width: number; height: number } };
      landmarks: { positions: Array<{ x: number; y: number }> };
      expressions: Record<string, number>;
    }>
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face detection boxes and landmarks
    detections.forEach(detection => {
      const { x, y, width, height } = detection.detection.box;
      
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw landmarks
      const landmarks = detection.landmarks;
      ctx.fillStyle = '#00ff00';
      landmarks.positions.forEach((point: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw emotion text
      const expressions = detection.expressions;
      const sortedEmotions = Object.entries(expressions).sort(([, a], [, b]) => (b as number) - (a as number));
      const [emotion, confidence] = sortedEmotions[0];
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(
        `${this.mapEmotionToIndonesian(emotion)} (${Math.round((confidence as number) * 100)}%)`,
        x,
        y - 10
      );
    });
  }

  public getEmotionDefinition(emotion: string): EmotionData | null {
    const emotionDefinitions: { [key: string]: EmotionData } = {
      'Bahagia': {
        emotion: 'Bahagia',
        confidence: 0.85,
        icon: '😊',
        color: 'bg-green-500',
        bgGradient: 'from-green-400/20 to-green-600/20'
      },
      'Sedih': {
        emotion: 'Sedih',
        confidence: 0.72,
        icon: '😢',
        color: 'bg-blue-500',
        bgGradient: 'from-blue-400/20 to-blue-600/20'
      },
      'Marah': {
        emotion: 'Marah',
        confidence: 0.68,
        icon: '😠',
        color: 'bg-red-500',
        bgGradient: 'from-red-400/20 to-red-600/20'
      },
      'Takut': {
        emotion: 'Takut',
        confidence: 0.65,
        icon: '😨',
        color: 'bg-purple-500',
        bgGradient: 'from-purple-400/20 to-purple-600/20'
      },
      'Jijik': {
        emotion: 'Jijik',
        confidence: 0.62,
        icon: '🤢',
        color: 'bg-yellow-500',
        bgGradient: 'from-yellow-400/20 to-yellow-600/20'
      },
      'Terkejut': {
        emotion: 'Terkejut',
        confidence: 0.70,
        icon: '😲',
        color: 'bg-orange-500',
        bgGradient: 'from-orange-400/20 to-orange-600/20'
      },
      'Netral': {
        emotion: 'Netral',
        confidence: 0.65,
        icon: '😐',
        color: 'bg-gray-500',
        bgGradient: 'from-gray-400/20 to-gray-600/20'
      }
    };

    return emotionDefinitions[emotion] || null;
  }
}

export const faceDetectionService = new FaceDetectionService();