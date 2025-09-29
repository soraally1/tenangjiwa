import { EmotionData } from './faceDetectionService';

export interface EmotionAnalysis {
  primary: EmotionData;
  secondary?: EmotionData;
  intensity: 'low' | 'medium' | 'high';
  stability: 'stable' | 'fluctuating' | 'unstable';
}

class EmotionDetectionService {
  private emotionHistory: EmotionData[] = [];
  private readonly maxHistoryLength = 20;

  public analyzeEmotionPattern(emotions: EmotionData[]): EmotionAnalysis | null {
    if (emotions.length === 0) return null;

    // Get the most recent emotion
    const latest = emotions[emotions.length - 1];
    
    // Calculate intensity based on confidence
    const intensity = this.calculateIntensity(latest.confidence);
    
    // Calculate stability based on recent history
    const stability = this.calculateStability(emotions.slice(-5));
    
    // Find secondary emotion (second most common in recent history)
    const secondary = this.findSecondaryEmotion(emotions.slice(-5));

    return {
      primary: latest,
      secondary,
      intensity,
      stability
    };
  }

  private calculateIntensity(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  private calculateStability(emotions: EmotionData[]): 'stable' | 'fluctuating' | 'unstable' {
    if (emotions.length < 3) return 'stable';

    const emotionTypes = emotions.map(e => e.emotion);
    const uniqueEmotions = new Set(emotionTypes).size;
    
    if (uniqueEmotions === 1) return 'stable';
    if (uniqueEmotions <= 3) return 'fluctuating';
    return 'unstable';
  }

  private findSecondaryEmotion(emotions: EmotionData[]): EmotionData | undefined {
    if (emotions.length < 2) return undefined;

    const emotionCounts: { [key: string]: { count: number; data: EmotionData } } = {};
    
    emotions.forEach(emotion => {
      if (emotionCounts[emotion.emotion]) {
        emotionCounts[emotion.emotion].count++;
      } else {
        emotionCounts[emotion.emotion] = { count: 1, data: emotion };
      }
    });

    const sortedEmotions = Object.values(emotionCounts)
      .sort((a, b) => b.count - a.count);

    return sortedEmotions.length > 1 ? sortedEmotions[1].data : undefined;
  }

  public generateEmotionInsight(analysis: EmotionAnalysis): string {
    const { primary, secondary, stability } = analysis;
    
    let insight = `Anda sedang merasakan ${primary.emotion.toLowerCase()}`;
    
    if (analysis.intensity === 'high') {
      insight += ` dengan intensitas yang kuat`;
    } else if (analysis.intensity === 'medium') {
      insight += ` dengan intensitas sedang`;
    } else {
      insight += ` dengan intensitas ringan`;
    }

    if (stability === 'stable') {
      insight += `. Emosi Anda terlihat stabil dan konsisten.`;
    } else if (stability === 'fluctuating') {
      insight += `. Emosi Anda mengalami beberapa perubahan.`;
    } else {
      insight += `. Emosi Anda terlihat tidak stabil dan berubah-ubah.`;
    }

    if (secondary) {
      insight += ` Selain itu, ada juga perasaan ${secondary.emotion.toLowerCase()} yang terdeteksi.`;
    }

    return insight;
  }

  public getEmotionRecommendation(analysis: EmotionAnalysis): string[] {
    const { primary, stability } = analysis;
    const recommendations: string[] = [];

    switch (primary.emotion) {
      case 'Bahagia':
        recommendations.push('Pertahankan energi positif ini!');
        recommendations.push('Bagikan kebahagiaan Anda dengan orang lain');
        break;
      case 'Sedih':
        recommendations.push('Coba lakukan aktivitas yang Anda sukai');
        recommendations.push('Berbicara dengan seseorang yang Anda percaya');
        recommendations.push('Lakukan latihan pernapasan dalam');
        break;
      case 'Marah':
        recommendations.push('Ambil napas dalam-dalam dan hitung sampai 10');
        recommendations.push('Coba lakukan aktivitas fisik untuk melepaskan energi');
        recommendations.push('Identifikasi penyebab kemarahan Anda');
        break;
      case 'Takut':
        recommendations.push('Ingatkan diri Anda bahwa perasaan ini akan berlalu');
        recommendations.push('Lakukan teknik grounding (5-4-3-2-1)');
        recommendations.push('Cari dukungan dari orang terdekat');
        break;
      case 'Netral':
        recommendations.push('Kondisi emosi yang seimbang');
        recommendations.push('Ini adalah waktu yang baik untuk refleksi');
        break;
      default:
        recommendations.push('Perhatikan perasaan Anda saat ini');
        recommendations.push('Coba lakukan aktivitas yang menenangkan');
    }

    if (stability === 'unstable') {
      recommendations.push('Pertimbangkan untuk berkonsultasi dengan profesional');
      recommendations.push('Coba teknik mindfulness untuk menenangkan pikiran');
    }

    return recommendations;
  }

  public addToHistory(emotion: EmotionData): void {
    this.emotionHistory.push(emotion);
    if (this.emotionHistory.length > this.maxHistoryLength) {
      this.emotionHistory.shift();
    }
  }

  public getHistory(): EmotionData[] {
    return [...this.emotionHistory];
  }

  public clearHistory(): void {
    this.emotionHistory = [];
  }
}

export const emotionDetectionService = new EmotionDetectionService();
