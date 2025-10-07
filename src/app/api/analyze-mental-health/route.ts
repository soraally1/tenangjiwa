import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    const { story, answers, score, maxScore } = await request.json();
    
    const prompt = `Anda adalah seorang psikolog profesional yang berpengalaman dalam menganalisis kesehatan mental. 
Seorang pasien telah menceritakan keluh kesahnya dan mengisi kuesioner kesehatan mental.

Cerita Pasien:
"${story}"

Hasil Kuesioner:
Skor Total: ${score} dari ${maxScore}
Persentase: ${((score / maxScore) * 100).toFixed(1)}%

Detail Jawaban:
${answers}

Berdasarkan cerita dan jawaban kuesioner tersebut, berikan analisis mendalam dan holistik tentang kondisi kesehatan mental pasien ini. Analisis Anda harus mencakup:

1. Tingkat keparahan (pilih salah satu): Baik, Ringan, Sedang, Berat, atau Sangat Berat
2. Analisis kondisi mental pasien (2-3 kalimat yang mendalam dan empati)
3. 4-6 rekomendasi spesifik dan actionable untuk meningkatkan kondisi mental
4. 3-5 task/mission konkret yang harus dikerjakan user untuk memperbaiki kondisi mental mereka. Setiap task harus memiliki:
   - title: judul task yang jelas
   - description: deskripsi detail task
   - targetValue: target numerik (misal: 30 untuk 30 hari, 12 untuk 12 sessions)
   - unit: satuan (hari, sessions, kali, menit, dll)
   - category: pilih dari mental-health, wellness, productivity, learning, social, atau personal
   - priority: high/medium/low berdasarkan urgensi untuk kondisi pasien

Format respons Anda dalam JSON dengan struktur berikut:
{
  "severity": "Baik/Ringan/Sedang/Berat/Sangat Berat",
  "analysis": "analisis kondisi mental pasien...",
  "recommendations": ["rekomendasi 1", "rekomendasi 2", ...],
  "tasks": [
    {
      "title": "Meditasi Harian",
      "description": "Melakukan meditasi mindfulness 10 menit setiap pagi untuk mengurangi kecemasan",
      "targetValue": 30,
      "unit": "hari",
      "category": "mental-health",
      "priority": "high"
    },
    ...dst
  ]
}

Penting: 
- Berikan analisis yang profesional, empati, dan memberikan harapan
- Tasks harus spesifik, terukur, dan achievable
- Tasks disesuaikan dengan masalah spesifik yang diceritakan pasien
- Jika kondisi berat, prioritaskan tasks untuk stabilisasi emosi

PENTING:
- HANYA return JSON yang valid, tidak ada teks lain sama sekali
- Jangan gunakan markdown code blocks
- Jangan tambahkan penjelasan atau komentar
- Pastikan semua string menggunakan double quotes
- Mulai respons langsung dengan { dan akhiri dengan }
- Wajib sertakan array tasks dengan minimal 3-5 task`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional psychologist who analyzes mental health assessments. You MUST respond with ONLY valid JSON format, no other text. Start your response with { and end with }. Do not use markdown code blocks or any explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    console.log('AI Analysis Response:', text); // Debug log
    
    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove any markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON in the response
    let analysisData;
    
    try {
      // First try to parse the entire cleaned text as JSON
      analysisData = JSON.parse(cleanedText);
    } catch {
      try {
        // If that fails, try to extract JSON using regex
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
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
    if (!analysisData || !analysisData.severity || !analysisData.analysis) {
      console.error('Invalid analysis structure:', analysisData);
      throw new Error('Invalid analysis structure from AI');
    }
    
    console.log('Successfully parsed analysis with', analysisData.tasks?.length || 0, 'tasks');
    
    return NextResponse.json({
      severity: analysisData.severity,
      score: score,
      analysis: analysisData.analysis,
      recommendations: analysisData.recommendations || [],
      tasks: analysisData.tasks || []
    });
    
  } catch (error) {
    console.error('Error analyzing mental health:', error);
    
    // Return basic analysis as fallback
    const { score, maxScore } = await request.json();
    const percentage = (score / maxScore) * 100;
    
    let severity, analysis, recommendations, tasks;
    
    if (percentage <= 20) {
      severity = 'Baik';
      analysis = 'Kesehatan mental Anda dalam kondisi baik. Anda menunjukkan tanda-tanda kesejahteraan mental yang positif.';
      recommendations = [
        'Pertahankan pola hidup sehat Anda',
        'Lakukan aktivitas yang Anda sukai',
        'Jaga hubungan sosial yang positif'
      ];
      tasks = [
        { title: 'Jurnal Harian', description: 'Menulis jurnal syukur setiap hari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'medium' },
        { title: 'Olahraga Rutin', description: 'Berolahraga minimal 30 menit', targetValue: 12, unit: 'sessions', category: 'wellness', priority: 'medium' }
      ];
    } else if (percentage <= 40) {
      severity = 'Ringan';
      analysis = 'Anda mengalami beberapa tanda stres atau kecemasan ringan yang perlu diperhatikan.';
      recommendations = [
        'Identifikasi sumber stres Anda',
        'Tingkatkan kualitas tidur',
        'Lakukan olahraga ringan secara teratur',
        'Bicarakan perasaan dengan orang terdekat'
      ];
      tasks = [
        { title: 'Meditasi Pagi', description: 'Meditasi mindfulness 10 menit setiap pagi', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Tidur Teratur', description: 'Tidur 7-8 jam dengan jadwal konsisten', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'high' },
        { title: 'Olahraga Ringan', description: 'Jalan kaki atau yoga 3x seminggu', targetValue: 12, unit: 'sessions', category: 'wellness', priority: 'medium' }
      ];
    } else if (percentage <= 60) {
      severity = 'Sedang';
      analysis = 'Anda menunjukkan gejala tingkat sedang yang mulai mempengaruhi kehidupan sehari-hari. Disarankan mencari bantuan profesional.';
      recommendations = [
        'Konsultasi dengan psikolog atau psikiater',
        'Pertimbangkan untuk mengikuti terapi',
        'Buat jadwal rutin dan patuhi',
        'Praktikkan self-care secara konsisten'
      ];
      tasks = [
        { title: 'Konsultasi Profesional', description: 'Jadwalkan dan hadiri sesi terapi', targetValue: 4, unit: 'sesi', category: 'mental-health', priority: 'high' },
        { title: 'Breathing Exercise', description: 'Latihan pernapasan 3x sehari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Rutinitas Harian', description: 'Buat dan ikuti jadwal harian', targetValue: 30, unit: 'hari', category: 'productivity', priority: 'medium' },
        { title: 'Social Connection', description: 'Bertemu teman/keluarga minimal 1x seminggu', targetValue: 4, unit: 'pertemuan', category: 'social', priority: 'medium' }
      ];
    } else if (percentage <= 80) {
      severity = 'Berat';
      analysis = 'Anda mengalami gejala serius yang memerlukan perhatian profesional segera.';
      recommendations = [
        'Segera konsultasi dengan psikiater',
        'Pertimbangkan terapi intensif',
        'Informasikan kondisi kepada keluarga terdekat',
        'Ikuti treatment plan dari profesional'
      ];
      tasks = [
        { title: 'Terapi Profesional', description: 'Sesi terapi intensif dengan psikiater', targetValue: 8, unit: 'sesi', category: 'mental-health', priority: 'high' },
        { title: 'Mood Tracking', description: 'Catat mood dan perasaan setiap hari', targetValue: 30, unit: 'hari', category: 'mental-health', priority: 'high' },
        { title: 'Support System', description: 'Hubungi support person setiap hari', targetValue: 30, unit: 'hari', category: 'social', priority: 'high' },
        { title: 'Self-Care Routine', description: 'Lakukan aktivitas self-care minimal 15 menit/hari', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'medium' }
      ];
    } else {
      severity = 'Sangat Berat';
      analysis = 'Kondisi Anda memerlukan perhatian medis segera. Jangan menunda mencari bantuan profesional.';
      recommendations = [
        'SEGERA hubungi profesional kesehatan mental',
        'Pertimbangkan rawat inap jika disarankan',
        'Hubungi hotline krisis: 119 ext 8',
        'Jangan tinggal sendirian'
      ];
      tasks = [
        { title: 'Crisis Intervention', description: 'Hubungi dan bertemu psikiater SEGERA', targetValue: 1, unit: 'konsultasi', category: 'mental-health', priority: 'high' },
        { title: 'Safety Planning', description: 'Buat rencana keamanan dengan profesional', targetValue: 1, unit: 'plan', category: 'mental-health', priority: 'high' },
        { title: 'Daily Check-in', description: 'Check-in dengan support person 2x sehari', targetValue: 30, unit: 'hari', category: 'social', priority: 'high' },
        { title: 'Medication Adherence', description: 'Minum obat sesuai resep dokter', targetValue: 30, unit: 'hari', category: 'wellness', priority: 'high' }
      ];
    }
    
    return NextResponse.json({
      severity,
      score,
      analysis,
      recommendations,
      tasks
    });
  }
}
