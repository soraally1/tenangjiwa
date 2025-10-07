import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '' });

export async function POST(request: NextRequest) {
  let story: string = '';
  
  try {
    const requestBody = await request.json();
    story = requestBody.story;
    
    if (!story || story.length < 50) {
      return NextResponse.json(
        { error: 'Story is too short' },
        { status: 400 }
      );
    }

    const prompt = `Anda adalah seorang psikolog profesional yang ahli dalam membuat pertanyaan asesmen kesehatan mental.

Seorang pasien telah menceritakan keluh kesahnya:
"${story}"

ANALISIS DULU cerita di atas dan identifikasi:
- Masalah utama yang dialami (contoh: stres kerja, kecemasan, depresi, masalah tidur, dll)
- Gejala yang disebutkan
- Area hidup yang terdampak (pekerjaan, hubungan, kesehatan fisik, dll)

Kemudian, berdasarkan ANALISIS tersebut, buatlah TEPAT 5 pertanyaan asesmen yang:
1. SANGAT SPESIFIK dengan masalah yang disebutkan dalam cerita (JANGAN generic)
2. Menggali lebih dalam tentang frekuensi, intensitas, dan dampak dari masalah tersebut
3. Mencakup aspek emosional, behavioral, dan kognitif yang RELEVAN dengan cerita
4. Setiap pertanyaan memiliki 4 opsi jawaban dengan skor 0-3

Contoh: 
- Jika cerita tentang stres kerja → tanya tentang beban kerja, hubungan dengan bos, work-life balance
- Jika cerita tentang kecemasan → tanya tentang serangan panik, worry, physical symptoms
- Jika cerita tentang masalah tidur → tanya tentang pola tidur, kualitas tidur, dampak ke aktivitas

Format respons Anda dalam JSON dengan struktur berikut:
{
  "questions": [
    {
      "id": 1,
      "text": "Pertanyaan SPESIFIK yang menyebutkan elemen dari cerita...",
      "options": [
        { "value": 0, "label": "Tidak pernah / Tidak ada masalah" },
        { "value": 1, "label": "Kadang-kadang / Ringan" },
        { "value": 2, "label": "Sering / Sedang" },
        { "value": 3, "label": "Hampir selalu / Parah" }
      ]
    },
    ...dst untuk 5 pertanyaan
  ]
}

KRITERIA PENTING: 
- Pertanyaan HARUS berbeda untuk setiap cerita yang berbeda
- Gunakan kata-kata atau situasi yang DISEBUTKAN dalam cerita
- Jangan gunakan pertanyaan template/generic yang sama untuk semua kasus
- Buat pertanyaan yang empati dan tidak judgmental

PENTING:
- HANYA return JSON yang valid, tidak ada teks lain sama sekali
- Jangan gunakan markdown code blocks
- Jangan tambahkan penjelasan atau komentar
- Pastikan semua string menggunakan double quotes
- Mulai respons langsung dengan { dan akhiri dengan }
- Setiap pertanyaan harus unik dan spesifik untuk cerita ini`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert psychologist who creates personalized mental health assessment questions. You MUST respond with ONLY valid JSON format, no other text. Start your response with { and end with }. Do not use markdown code blocks or any explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 0.95
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    console.log('AI Response:', text); // Debug log
    
    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove any markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON in the response
    let questionsData;
    
    try {
      // First try to parse the entire cleaned text as JSON
      questionsData = JSON.parse(cleanedText);
    } catch {
      try {
        // If that fails, try to extract JSON using regex
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          questionsData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e2) {
        console.error('JSON parsing failed:', e2);
        console.error('Original text:', text);
        throw new Error('Failed to parse AI response');
      }
    }
    
    // Validate the structure
    if (!questionsData || !questionsData.questions || !Array.isArray(questionsData.questions)) {
      console.error('Invalid questions structure:', questionsData);
      throw new Error('Invalid questions structure from AI');
    }
    
    // Validate each question has required fields
    for (const question of questionsData.questions) {
      if (!question.id || !question.text || !question.options || !Array.isArray(question.options)) {
        console.error('Invalid question structure:', question);
        throw new Error('Invalid question structure from AI');
      }
    }
    
    console.log('Successfully parsed questions:', questionsData.questions.length);
    return NextResponse.json(questionsData);
    
  } catch (error) {
    console.error('Error generating questions:', error);
    console.error('Story that failed:', story);
    
    // Generate semi-personalized fallback questions based on story keywords
    const generateFallbackQuestions = (story: string) => {
      const storyLower = story.toLowerCase();
      const questions = [];
      
      // Base question about frequency
      questions.push({
        id: 1,
        text: `Seberapa sering Anda mengalami situasi yang Anda ceritakan dalam 2 minggu terakhir?`,
        options: [
          { value: 0, label: 'Tidak pernah atau sangat jarang' },
          { value: 1, label: 'Beberapa hari' },
          { value: 2, label: 'Lebih dari setengah waktu' },
          { value: 3, label: 'Hampir setiap hari' }
        ]
      });

      // Impact question
      questions.push({
        id: 2,
        text: 'Seberapa besar dampak masalah ini terhadap aktivitas sehari-hari Anda?',
        options: [
          { value: 0, label: 'Tidak ada dampak' },
          { value: 1, label: 'Dampak ringan, masih bisa berfungsi normal' },
          { value: 2, label: 'Dampak sedang, sulit menyelesaikan tugas' },
          { value: 3, label: 'Dampak berat, tidak bisa berfungsi normal' }
        ]
      });

      // Sleep question (if sleep-related keywords found)
      if (storyLower.includes('tidur') || storyLower.includes('insomnia') || storyLower.includes('susah tidur')) {
        questions.push({
          id: 3,
          text: 'Bagaimana kualitas tidur Anda belakangan ini?',
          options: [
            { value: 0, label: 'Tidur normal dan nyenyak' },
            { value: 1, label: 'Sedikit terganggu, sesekali sulit tidur' },
            { value: 2, label: 'Sering terganggu, sulit tidur atau bangun terlalu pagi' },
            { value: 3, label: 'Sangat terganggu, insomnia atau tidur berlebihan' }
          ]
        });
      } else if (storyLower.includes('kerja') || storyLower.includes('pekerjaan') || storyLower.includes('kantor')) {
        questions.push({
          id: 3,
          text: 'Seberapa sulit Anda berkonsentrasi dalam pekerjaan atau tugas sehari-hari?',
          options: [
            { value: 0, label: 'Tidak ada kesulitan' },
            { value: 1, label: 'Sedikit sulit, tapi masih bisa fokus' },
            { value: 2, label: 'Cukup sulit, sering terdistraksi' },
            { value: 3, label: 'Sangat sulit, tidak bisa fokus sama sekali' }
          ]
        });
      } else {
        questions.push({
          id: 3,
          text: 'Bagaimana mood atau suasana hati Anda secara keseluruhan?',
          options: [
            { value: 0, label: 'Stabil dan positif' },
            { value: 1, label: 'Kadang turun naik, tapi masih terkendali' },
            { value: 2, label: 'Sering merasa sedih atau cemas' },
            { value: 3, label: 'Sangat buruk, merasa putus asa' }
          ]
        });
      }

      // Enjoyment question
      questions.push({
        id: 4,
        text: 'Apakah Anda masih menemukan kesenangan dalam aktivitas yang biasanya Anda nikmati?',
        options: [
          { value: 0, label: 'Ya, masih menikmati seperti biasa' },
          { value: 1, label: 'Sedikit berkurang, tapi masih ada kesenangan' },
          { value: 2, label: 'Sangat berkurang, jarang merasa senang' },
          { value: 3, label: 'Tidak ada kesenangan sama sekali' }
        ]
      });

      // Safety question
      questions.push({
        id: 5,
        text: 'Apakah Anda pernah memiliki pikiran untuk menyakiti diri sendiri?',
        options: [
          { value: 0, label: 'Tidak pernah' },
          { value: 1, label: 'Sesekali terlintas, tapi tidak serius' },
          { value: 2, label: 'Cukup sering dan mulai mengkhawatirkan' },
          { value: 3, label: 'Sangat sering dan memiliki rencana' }
        ]
      });

      return questions;
    };
    
    return NextResponse.json({
      questions: generateFallbackQuestions(story)
    });
  }
}
