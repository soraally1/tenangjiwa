import { EmotionData } from './faceDetectionService';

export interface EyeTrackingData {
  blinkRate: number; // blinks per minute
  eyeContactDuration: number; // percentage of time looking at camera
  gazeStability: number; // how stable the gaze is (0-1)
  pupilDilation: number; // relative pupil size
  eyeMovementSpeed: number; // average speed of eye movements
  fixationDuration: number; // average time spent looking at one point
}

export interface BehavioralPatterns {
  smileFrequency: number; // smiles per minute
  headMovement: number; // amount of head movement
  postureStability: number; // how stable the posture is
  responseTime: number; // time to respond to stimuli
  energyLevel: number; // overall energy in movements
  socialEngagement: number; // level of social engagement
}

export interface MentalHealthIndicators {
  depressionScore: number; // 0-100, higher = more likely depressed
  anxietyScore: number; // 0-100, higher = more likely anxious
  stressLevel: number; // 0-100, higher = more stressed
  socialWithdrawal: number; // 0-100, higher = more withdrawn
  emotionalInstability: number; // 0-100, higher = more unstable
  cognitiveLoad: number; // 0-100, higher = more cognitive stress
}

export interface MentalHealthAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  indicators: MentalHealthIndicators;
  eyeTracking: EyeTrackingData;
  behavioral: BehavioralPatterns;
  recommendations: string[];
  professionalHelpNeeded: boolean;
  confidence: number; // 0-1, how confident the assessment is
}

export interface DepressionIndicators {
  // Facial expression indicators
  reducedSmiling: boolean;
  droopyEyes: boolean;
  flatAffect: boolean;
  forcedSmile: boolean;
  
  // Eye movement indicators
  reducedEyeContact: boolean;
  slowBlinking: boolean;
  downwardGaze: boolean;
  unfocusedEyes: boolean;
  
  // Behavioral indicators
  reducedHeadMovement: boolean;
  slumpedPosture: boolean;
  slowResponse: boolean;
  lowEnergy: boolean;
}

class MentalHealthDetectionService {
  private eyeTrackingHistory: EyeTrackingData[] = [];
  private behavioralHistory: BehavioralPatterns[] = [];
  private emotionHistory: EmotionData[] = [];
  private readonly maxHistoryLength = 50;

  public analyzeMentalHealth(
    currentEmotion: EmotionData | null,
    eyeTracking: EyeTrackingData,
    behavioral: BehavioralPatterns
  ): MentalHealthAssessment {
    // Add to history (simplified)
    this.eyeTrackingHistory.push(eyeTracking);
    this.behavioralHistory.push(behavioral);
    if (currentEmotion) {
      this.emotionHistory.push(currentEmotion);
    }

    // Keep history manageable (reduced size for better performance)
    this.eyeTrackingHistory = this.eyeTrackingHistory.slice(-10);
    this.behavioralHistory = this.behavioralHistory.slice(-10);
    this.emotionHistory = this.emotionHistory.slice(-10);

    // Analyze depression indicators
    const depressionIndicators = this.analyzeDepressionIndicators(currentEmotion, eyeTracking, behavioral);
    
    // Calculate mental health scores
    const indicators = this.calculateMentalHealthScores(depressionIndicators, eyeTracking, behavioral);
    
    // Determine overall risk level
    const overallRisk = this.determineRiskLevel(indicators);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(indicators, depressionIndicators);
    
    // Determine if professional help is needed
    const professionalHelpNeeded = this.shouldRecommendProfessionalHelp(indicators, overallRisk);
    
    // Calculate confidence based on data quality and consistency
    const confidence = this.calculateConfidence();

    return {
      overallRisk,
      indicators,
      eyeTracking,
      behavioral,
      recommendations,
      professionalHelpNeeded,
      confidence
    };
  }

  private analyzeDepressionIndicators(
    currentEmotion: EmotionData | null,
    eyeTracking: EyeTrackingData,
    behavioral: BehavioralPatterns
  ): DepressionIndicators {
    // Simplified analysis for better performance
    const reducedSmiling = behavioral.smileFrequency < 0.3;
    const droopyEyes = eyeTracking.eyeContactDuration < 0.3;
    const flatAffect = currentEmotion?.emotion === 'Netral' && currentEmotion.confidence > 0.7;
    const forcedSmile = currentEmotion?.emotion === 'Bahagia' && currentEmotion.confidence < 0.5;

    const reducedEyeContact = eyeTracking.eyeContactDuration < 0.4;
    const slowBlinking = eyeTracking.blinkRate < 6;
    const downwardGaze = eyeTracking.gazeStability < 0.4;
    const unfocusedEyes = eyeTracking.fixationDuration < 0.4;

    const reducedHeadMovement = behavioral.headMovement < 0.2;
    const slumpedPosture = behavioral.postureStability > 0.7;
    const slowResponse = behavioral.responseTime > 1.5;
    const lowEnergy = behavioral.energyLevel < 0.4;

    return {
      reducedSmiling,
      droopyEyes,
      flatAffect,
      forcedSmile,
      reducedEyeContact,
      slowBlinking,
      downwardGaze,
      unfocusedEyes,
      reducedHeadMovement,
      slumpedPosture,
      slowResponse,
      lowEnergy
    };
  }

  private calculateMentalHealthScores(
    depressionIndicators: DepressionIndicators,
    eyeTracking: EyeTrackingData,
    behavioral: BehavioralPatterns
  ): MentalHealthIndicators {
    // Calculate depression score
    let depressionScore = 0;
    const depressionFactors = [
      depressionIndicators.reducedSmiling ? 15 : 0,
      depressionIndicators.droopyEyes ? 12 : 0,
      depressionIndicators.flatAffect ? 18 : 0,
      depressionIndicators.forcedSmile ? 10 : 0,
      depressionIndicators.reducedEyeContact ? 12 : 0,
      depressionIndicators.slowBlinking ? 8 : 0,
      depressionIndicators.downwardGaze ? 10 : 0,
      depressionIndicators.unfocusedEyes ? 8 : 0,
      depressionIndicators.reducedHeadMovement ? 7 : 0,
      depressionIndicators.slumpedPosture ? 10 : 0,
      depressionIndicators.slowResponse ? 8 : 0,
      depressionIndicators.lowEnergy ? 12 : 0,
    ];
    depressionScore = Math.min(100, depressionFactors.reduce((sum, factor) => sum + factor, 0));

    // Calculate anxiety score
    let anxietyScore = 0;
    if (eyeTracking.blinkRate > 20) anxietyScore += 20; // Excessive blinking
    if (eyeTracking.eyeMovementSpeed > 0.8) anxietyScore += 15; // Rapid eye movements
    if (behavioral.headMovement > 0.7) anxietyScore += 15; // Excessive head movement
    if (behavioral.responseTime < 0.5) anxietyScore += 10; // Very quick responses
    if (eyeTracking.gazeStability < 0.2) anxietyScore += 20; // Very unstable gaze
    if (behavioral.energyLevel > 0.8) anxietyScore += 20; // High energy (restlessness)

    // Calculate stress level
    let stressLevel = 0;
    if (eyeTracking.pupilDilation > 0.7) stressLevel += 15; // Dilated pupils
    if (eyeTracking.blinkRate > 15) stressLevel += 10; // Increased blinking
    if (behavioral.postureStability < 0.3) stressLevel += 15; // Unstable posture
    if (behavioral.responseTime > 1.5) stressLevel += 10; // Slower responses
    if (eyeTracking.fixationDuration < 0.3) stressLevel += 15; // Short attention span
    if (behavioral.socialEngagement < 0.3) stressLevel += 15; // Low social engagement

    // Calculate social withdrawal
    let socialWithdrawal = 0;
    if (eyeTracking.eyeContactDuration < 0.3) socialWithdrawal += 25;
    if (behavioral.socialEngagement < 0.3) socialWithdrawal += 25;
    if (behavioral.smileFrequency < 0.5) socialWithdrawal += 20;
    if (behavioral.headMovement < 0.3) socialWithdrawal += 15;
    if (behavioral.energyLevel < 0.3) socialWithdrawal += 15;

    // Calculate emotional instability
    let emotionalInstability = 0;
    const recentEmotions = this.emotionHistory.slice(-10);
    if (recentEmotions.length > 3) {
      const uniqueEmotions = new Set(recentEmotions.map(e => e.emotion)).size;
      emotionalInstability = Math.min(100, uniqueEmotions * 15);
    }

    // Calculate cognitive load
    let cognitiveLoad = 0;
    if (eyeTracking.fixationDuration < 0.4) cognitiveLoad += 20; // Short attention
    if (behavioral.responseTime > 2.0) cognitiveLoad += 15; // Slow processing
    if (eyeTracking.gazeStability < 0.3) cognitiveLoad += 15; // Difficulty focusing
    if (behavioral.postureStability < 0.4) cognitiveLoad += 10; // Restlessness
    if (eyeTracking.eyeMovementSpeed > 0.6) cognitiveLoad += 10; // Rapid scanning

    return {
      depressionScore: Math.min(100, depressionScore),
      anxietyScore: Math.min(100, anxietyScore),
      stressLevel: Math.min(100, stressLevel),
      socialWithdrawal: Math.min(100, socialWithdrawal),
      emotionalInstability: Math.min(100, emotionalInstability),
      cognitiveLoad: Math.min(100, cognitiveLoad)
    };
  }

  private determineRiskLevel(indicators: MentalHealthIndicators): 'low' | 'moderate' | 'high' | 'critical' {
    const maxScore = Math.max(
      indicators.depressionScore,
      indicators.anxietyScore,
      indicators.stressLevel,
      indicators.socialWithdrawal,
      indicators.emotionalInstability,
      indicators.cognitiveLoad
    );

    if (maxScore >= 80) return 'critical';
    if (maxScore >= 60) return 'high';
    if (maxScore >= 40) return 'moderate';
    return 'low';
  }

  private generateRecommendations(
    indicators: MentalHealthIndicators,
    depressionIndicators: DepressionIndicators
  ): string[] {
    const recommendations: string[] = [];

    // Depression-related recommendations
    if (indicators.depressionScore > 50) {
      recommendations.push("Pertimbangkan untuk melakukan aktivitas yang Anda sukai");
      recommendations.push("Coba lakukan olahraga ringan seperti berjalan kaki");
      recommendations.push("Jaga rutinitas tidur yang teratur");
      recommendations.push("Habiskan waktu dengan orang-orang terdekat");
    }

    // Anxiety-related recommendations
    if (indicators.anxietyScore > 50) {
      recommendations.push("Lakukan teknik pernapasan dalam (4-7-8 breathing)");
      recommendations.push("Coba meditasi atau mindfulness selama 10-15 menit");
      recommendations.push("Hindari kafein dan stimulan lainnya");
      recommendations.push("Buat jadwal yang terstruktur untuk mengurangi kecemasan");
    }

    // Stress-related recommendations
    if (indicators.stressLevel > 50) {
      recommendations.push("Lakukan relaksasi otot progresif");
      recommendations.push("Coba teknik grounding (5-4-3-2-1)");
      recommendations.push("Batasi paparan media sosial dan berita");
      recommendations.push("Prioritaskan self-care dan istirahat yang cukup");
    }

    // Social withdrawal recommendations
    if (indicators.socialWithdrawal > 50) {
      recommendations.push("Coba berinteraksi dengan teman atau keluarga");
      recommendations.push("Bergabung dengan komunitas atau grup hobi");
      recommendations.push("Mulai dengan interaksi kecil dan bertahap");
      recommendations.push("Pertimbangkan terapi kelompok");
    }

    // General mental health recommendations
    if (indicators.depressionScore > 30 || indicators.anxietyScore > 30) {
      recommendations.push("Jaga pola makan yang sehat dan bergizi");
      recommendations.push("Pastikan Anda tidur 7-9 jam setiap malam");
      recommendations.push("Batasi konsumsi alkohol dan zat adiktif");
      recommendations.push("Cari dukungan dari profesional kesehatan mental");
    }

    // If no specific issues, provide general wellness tips
    if (recommendations.length === 0) {
      recommendations.push("Pertahankan rutinitas yang sehat");
      recommendations.push("Jaga koneksi sosial yang positif");
      recommendations.push("Lakukan aktivitas yang memberikan makna");
      recommendations.push("Praktikkan mindfulness dan gratitude");
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  private shouldRecommendProfessionalHelp(
    indicators: MentalHealthIndicators,
    riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  ): boolean {
    // Recommend professional help for high or critical risk
    if (riskLevel === 'high' || riskLevel === 'critical') return true;
    
    // Recommend if multiple indicators are elevated
    const elevatedIndicators = Object.values(indicators).filter(score => score > 60).length;
    if (elevatedIndicators >= 3) return true;
    
    // Recommend if depression score is very high
    if (indicators.depressionScore > 70) return true;
    
    return false;
  }

  private calculateConfidence(): number {
    // Confidence based on amount of data and consistency
    const dataPoints = Math.min(this.emotionHistory.length, this.eyeTrackingHistory.length, this.behavioralHistory.length);
    
    if (dataPoints < 5) return 0.3; // Low confidence with little data
    if (dataPoints < 15) return 0.6; // Medium confidence
    return 0.8; // High confidence with sufficient data
  }

  public getMentalHealthHistory(): {
    eyeTracking: EyeTrackingData[];
    behavioral: BehavioralPatterns[];
    emotions: EmotionData[];
  } {
    return {
      eyeTracking: [...this.eyeTrackingHistory],
      behavioral: [...this.behavioralHistory],
      emotions: [...this.emotionHistory]
    };
  }

  public clearHistory(): void {
    this.eyeTrackingHistory = [];
    this.behavioralHistory = [];
    this.emotionHistory = [];
  }
}

export const mentalHealthDetectionService = new MentalHealthDetectionService();
