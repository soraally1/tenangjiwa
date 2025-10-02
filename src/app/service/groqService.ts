import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true // Allow browser usage for client-side calls
});

export interface EmotionContext {
  emotion: string;
  confidence: number;
}

export interface ChatContext {
  previousMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  emotionContext?: EmotionContext;
  mentalHealthContext?: {
    overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    indicators: {
      depressionScore: number;
      anxietyScore: number;
      stressLevel: number;
    };
  };
}

export class GroqService {
  private static instance: GroqService;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  private constructor() {}

  public static getInstance(): GroqService {
    if (!GroqService.instance) {
      GroqService.instance = new GroqService();
    }
    return GroqService.instance;
  }

  /**
   * Generate AI response using Groq with emotion and mental health context
   */
  public async generateResponse(
    userMessage: string,
    context?: ChatContext
  ): Promise<string> {
    try {
      // Build system prompt with emotion and mental health awareness
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Add user message to conversation history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Keep only last 10 messages to manage context length
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Prepare messages for Groq API
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.conversationHistory
      ];

      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile', // Using Llama 3.3 70B for better responses
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        stream: false
      });

      const aiResponse = completion.choices[0]?.message?.content || 
        'Maaf, saya mengalami kesulitan memproses pesan Anda. Silakan coba lagi.';

      // Add AI response to conversation history
      this.conversationHistory.push({ role: 'assistant', content: aiResponse });

      return aiResponse;

    } catch (error) {
      console.error('Error calling Groq API:', error);
      
      // Fallback to emotion-based responses if API fails
      return this.getFallbackResponse(userMessage, context?.emotionContext);
    }
  }

  /**
   * Build system prompt based on emotion and mental health context
   */
  private buildSystemPrompt(context?: ChatContext): string {
    let prompt = `Anda adalah TenJin, seorang AI counselor yang empati dan profesional yang membantu orang Indonesia dengan masalah kesehatan mental. Anda berbicara dalam bahasa Indonesia yang hangat dan mendukung.

Karakteristik Anda:
- Empati dan pengertian
- Memberikan dukungan emosional
- Tidak menggurui atau menghakimi
- Menggunakan bahasa yang mudah dipahami
- Fokus pada mendengarkan dan validasi perasaan
- Memberikan saran praktis yang dapat diterapkan

Pedoman respons:
- Selalu validasi perasaan pengguna
- Berikan respons yang mendukung dan membangun
- Jika mendeteksi risiko tinggi, sarankan untuk mencari bantuan profesional
- Gunakan bahasa yang hangat dan tidak formal
- Panjang respons maksimal 2-3 kalimat agar mudah dibaca`;

    // Add emotion context if available
    if (context?.emotionContext) {
      const { emotion, confidence } = context.emotionContext;
      prompt += `\n\nKonteks emosi saat ini: Saya mendeteksi bahwa pengguna sedang merasakan "${emotion}" dengan tingkat kepercayaan ${Math.round(confidence * 100)}%. Sesuaikan respons Anda dengan emosi ini.`;
    }

    // Add mental health context if available
    if (context?.mentalHealthContext) {
      const { overallRisk } = context.mentalHealthContext;
      prompt += `\n\nKonteks kesehatan mental: Tingkat risiko saat ini adalah "${overallRisk}". Berikan perhatian khusus jika risiko tinggi atau kritis.`;
    }

    return prompt;
  }

  /**
   * Fallback response when API fails
   */
  private getFallbackResponse(userMessage: string, emotion?: EmotionContext): string {
    const emotionResponses = {
      Bahagia: [
        "Senang melihat Anda bahagia! Ceritakan lebih lanjut tentang apa yang membuat Anda gembira.",
        "Energi positif Anda sangat menular! Apa yang sedang membuat hari Anda istimewa?",
        "Saya bisa merasakan kebahagiaan Anda. Mari berbagi cerita indah ini!",
      ],
      Sedih: [
        "Saya melihat ada kesedihan di mata Anda. Saya di sini untuk mendengarkan cerita Anda.",
        "Terkadang berbagi perasaan bisa membantu. Apa yang sedang mengganggu pikiran Anda?",
        "Ingatlah bahwa perasaan sedih adalah bagian normal dari hidup. Ceritakan pada saya.",
      ],
      Marah: [
        "Saya mendeteksi kemarahan. Mari kita bicarakan apa yang membuat Anda marah.",
        "Kemarahan adalah perasaan yang valid. Ceritakan apa yang terjadi.",
        "Saya di sini untuk mendengarkan. Apa yang sedang mengganggu Anda?",
      ],
      Takut: [
        "Saya melihat ketakutan di mata Anda. Saya di sini untuk membantu Anda merasa aman.",
        "Takut adalah perasaan yang normal. Ceritakan apa yang membuat Anda takut.",
        "Mari kita bicarakan ketakutan Anda bersama-sama.",
      ],
      Netral: [
        "Anda terlihat tenang dan seimbang. Bagaimana perasaan Anda hari ini?",
        "Saya melihat ketenangan dalam ekspresi Anda. Ada yang ingin Anda ceritakan?",
        "Kondisi emosi yang stabil menunjukkan kedewasaan. Mari berbincang!",
      ],
    };

    const generalResponses = [
      "Terima kasih sudah berbagi dengan saya. Bagaimana perasaan Anda sekarang?",
      "Saya mendengarkan dengan seksama. Ada lagi yang ingin Anda ceritakan?",
      "Itu menarik! Saya senang bisa mendengar cerita Anda.",
      "Saya memahami perasaan Anda. Mari kita bicarakan lebih lanjut.",
    ];

    if (emotion) {
      const responses = emotionResponses[emotion.emotion as keyof typeof emotionResponses];
      return responses ? responses[Math.floor(Math.random() * responses.length)] : 
        generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  /**
   * Clear conversation history
   */
  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  public getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Check if API key is configured
   */
  public static isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_GROQ_API_KEY;
  }
}

// Export singleton instance
export const groqService = GroqService.getInstance();
