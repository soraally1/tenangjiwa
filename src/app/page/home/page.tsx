'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import depresiImg from '../../../../public/mood/Depresi.png';
import kecanduanImg from '../../../../public/mood/Kecanduan.png';
import moodswingImg from '../../../../public/mood/MoodSwing.png';
import stressImg from '../../../../public/mood/Stress.png';
import traumaImg from '../../../../public/mood/Trauma.png';
import Navbar from '@/app/component/navbar';

interface Condition {
  id: number;
  name: string;
  image: string; // Using string for now, can be changed to StaticImageData when images are properly set up
  description: string;
  symptoms: string[];
}

const conditions: Condition[] = [
  {
    id: 1,
    name: 'Depresi',
    image: depresiImg.src,
    description: 'Depresi adalah kondisi mental yang serius namun dapat diobati. Jika kamu merasa kehilangan minat, kesulitan tidur, atau memiliki pikiran negatif selama lebih dari 2 minggu, jangan ragu untuk mencari bantuan. Kamu tidak sendirian dalam menghadapi ini. 💙',
    symptoms: ['Perasaan sedih berkepanjangan', 'Kehilangan minat', 'Gangguan tidur', 'Pikiran negatif', 'Kelelahan mental']
  },
  {
    id: 2,
    name: 'Stress',
    image: stressImg.src,
    description: 'Stress adalah respons alami tubuh terhadap tekanan, namun jika berlebihan dapat mempengaruhi kesehatan mental dan fisik. Kenali tanda-tandanya dan kelola stress dengan tepat untuk hidup yang lebih seimbang. ',
    symptoms: ['Mudah cemas', 'Sulit berkonsentrasi', 'Ketegangan otot', 'Perubahan nafsu makan', 'Gangguan tidur']
  },
  {
    id: 3,
    name: 'Moodswing',
    image: moodswingImg.src,
    description: 'Moodswing atau perubahan suasana hati yang drastis bisa mempengaruhi kehidupan sehari-hari. Penting untuk mengenali pola perubahan mood dan mencari cara sehat untuk mengelolanya. 🎭',
    symptoms: ['Perubahan emosi tiba-tiba', 'Sensitifitas tinggi', 'Energi naik-turun', 'Perubahan perilaku', 'Kesulitan mengontrol emosi']
  },
  {
    id: 4,
    name: 'Trauma',
    image: traumaImg.src,
    description: 'Trauma adalah bekas luka emosional yang dapat mempengaruhi kesehatan mental jangka panjang. Dengan dukungan yang tepat dan penanganan profesional, pemulihan dari trauma adalah sesuatu yang mungkin. 🌅',
    symptoms: ['Flashback kejadian', 'Mimpi buruk', 'Kecemasan berlebih', 'Menghindari tempat/situasi tertentu', 'Kesulitan percaya']
  },
  {
    id: 5,
    name: 'Kecanduan',
    image: kecanduanImg.src,
    description: 'Kecanduan adalah kondisi kompleks yang mempengaruhi otak dan perilaku. Meski sulit, dengan tekad dan bantuan profesional, kecanduan dapat diatasi. Langkah pertama adalah mengakui dan mencari bantuan. 🌟',
    symptoms: ['Kehilangan kontrol', 'Perubahan prioritas', 'Gejala putus zat', 'Pengabaian tanggung jawab', 'Isolasi sosial']
  },
];

export default function HomePage() {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ top: number; left: number; duration: number; delay: number }>>([]);
  const [isClient, setIsClient] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles = [...Array(20)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
    setParticles(generatedParticles);
    setIsClient(true);
  }, []);

  // Auto-scroll to details when a condition is selected
  useEffect(() => {
    if (!selectedCondition) return;
    // wait for the details section to mount
    const id = window.setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(id);
  }, [selectedCondition]);

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const cardVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    hover: { y: -15, scale: 1.05, transition: { duration: 0.2 } },
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] relative">
      <Navbar/>
    <motion.div className="relative" initial="hidden" animate="visible" variants={containerVariants}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="relative w-full pb-24" variants={fadeUp}>
          {isClient && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {particles.map((particle, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
                  style={{
                    top: `${particle.top}%`,
                    left: `${particle.left}%`,
                  }}
                  animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
                  transition={{
                    duration: particle.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: particle.delay,
                  }}
                />
              ))}
            </motion.div>
          )}

          <div className="w-full max-w-[1280px] mx-auto">
            <div className="pt-32 pb-16">
              <motion.div className="flex flex-col justify-center" variants={containerVariants}>
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E498E] mb-2 relative"
                  variants={fadeUp}
                >
                  Hai Sahabat Jiwa
                  <motion.span
                    className="absolute -left-4 -top-4 w-20 h-20 bg-pink-500/10 rounded-full blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                  />
                </motion.h1>
                <motion.h2
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1E498E] mb-6 relative"
                  variants={fadeUp}
                >
                  Bagaimana Kabar Kamu Hari Ini?
                  <motion.span
                    className="absolute -left-4 -top-4 w-20 h-20 bg-pink-500/10 rounded-full blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                  />
                </motion.h2>
                <motion.p className="text-xl md:text-2xl text-[#1E498E] mb-12 relative " variants={fadeUp}>
                  Kenali perasaan jiwa kamu yuk! 😉
                  <motion.span
                    className="absolute -left-4 -top-4 w-20 h-20 bg-pink-500/10 rounded-full blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                  />
                </motion.p>

                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-8"
                  variants={containerVariants}
                >
                  {conditions.map((condition) => (
                    <motion.button
                      key={condition.id}
                      onClick={() => setSelectedCondition(condition.name)}
                      variants={cardVariant}
                      whileHover="hover"
                      className={`relative h-48 md:h-64 overflow-hidden rounded-[32px] transition-all duration-300
                        ${selectedCondition === condition.name ? "ring-4 ring-[#1E498E]/40" : ""}
                        group shadow-lg backdrop-blur-sm`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFF3E0]"
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />

                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Image
                          src={condition.image || "/placeholder.svg"}
                          alt={condition.name}
                          width={200}
                          height={200}
                          className="max-w-full max-h-full object-contain p-4"
                        />
                      </motion.div>

                      <div
                        className="absolute bottom-0 left-0 right-0 h-1/2"
                        style={{
                          background: "linear-gradient(to top, #FFF3E0 20%, #FFF3E0 10%, transparent 100%)",
                        }}
                      />

                      <motion.div className="absolute bottom-0 left-0 right-0 p-4 md:p-6" whileHover={{ y: -5 }}>
                        <motion.span
                          className="text-[#1E498E] text-lg md:text-2xl font-semibold block"
                          whileHover={{ scale: 1.05 }}
                        >
                          {condition.name}
                        </motion.span>
                      </motion.div>

                      <motion.div
                        className="absolute top-4 right-4 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {selectedCondition && (
                <motion.div
                  key={selectedCondition}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-32"
                  ref={detailsRef}
                >
                  <motion.h2
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl md:text-3xl font-bold mb-6 uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#1E498E] to-pink-500"
                  >
                    {selectedCondition}
                  </motion.h2>

                  <motion.div
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5"
                      animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                      transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                    />

                    <div className="relative z-10">
                      <motion.p
                        className="text-[#1E498E] text-base md:text-lg mb-8 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {conditions.find((c) => c.name === selectedCondition)?.description}
                      </motion.p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {conditions
                          .find((c) => c.name === selectedCondition)
                          ?.symptoms.map((symptom, index) => (
                            <motion.div
                              key={symptom}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center space-x-3 group"
                            >
                              <motion.div
                                className="w-2 h-2 bg-pink-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                              />
                              <span className="text-[#1E498E] text-sm md:text-base group-hover:text-pink-500 transition-colors">
                                {symptom}
                              </span>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>

    <section className="relative py-20 overflow-hidden min-h-screen max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1E498E] mb-6">Pilih Jenis Konsultasi</h2>
          <p className="text-lg text-[#1E498E]/80 max-w-2xl mx-auto">
            Dapatkan bantuan profesional dengan cara yang paling sesuai untuk Anda
          </p>
        </motion.div>

        <div className="space-y-20">
          {/* Professional Psychiatrist Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-center gap-12"
          >
            <div className="lg:w-1/2">
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E498E]/20 to-transparent rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
                <Image
                  src="/dokter.png"
                  alt="Professional Psychiatrist"
                  width={600}
                  height={400}
                  className="w-full h-[400px] object-cover rounded-2xl shadow-2xl relative z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF3E0]/80 via-transparent to-transparent rounded-2xl z-20"></div>
              </motion.div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="inline-block px-4 py-2 bg-[#1E498E]/10 text-[#1E498E] rounded-full text-sm font-medium mb-4">
                  Konsultasi Profesional
                </span>
                <h3 className="text-3xl md:text-4xl font-bold text-[#1E498E] mb-4">Psikiater Berpengalaman</h3>
                <p className="text-lg text-[#1E498E]/80 mb-6 leading-relaxed">
                  Konsultasi langsung dengan psikiater berlisensi dan berpengalaman. Dapatkan diagnosis yang akurat
                  dan penanganan yang tepat untuk kondisi mental Anda.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                {[
                  { icon: "⭐", text: "Rating 4.9/5 dari 1000+ pasien" },
                  { icon: "🏥", text: "Tersedia 24/7 untuk konsultasi darurat" },
                  { icon: "💊", text: "Dapat meresepkan obat jika diperlukan" },
                  { icon: "📋", text: "Riwayat konsultasi tersimpan aman" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[#1E498E]/80">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="pt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(30, 73, 142, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#1E498E] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-[#1E498E]/90 transition-colors duration-300"
                >
                  <Link href="/konsultasi">
                  
                  Konsultasi Sekarang 
                  </Link>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* AI Consultation Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row-reverse items-center gap-12"
          >
            <div className="lg:w-1/2">
              <motion.div
                whileHover={{ scale: 1.02, rotateY: -5 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <Image
                  src="/Tenjin.png"
                  alt="AI Consultation Assistant"
                  width={600}
                  height={400}
                  className="w-full h-[400px] object-contain rounded-2xl relative z-10"
                />
              </motion.div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="inline-block px-4 py-2 bg-pink-500/10 text-pink-600 rounded-full text-sm font-medium mb-4">
                  AI Assistant
                </span>
                <h3 className="text-3xl md:text-4xl font-bold text-[#1E498E] mb-4">TenJin</h3>
                <p className="text-lg text-[#1E498E]/80 mb-6 leading-relaxed">
                  Konsultasi awal dengan TenJin, SahabatJiwa yang telah dilatih khusus untuk kesehatan mental. Dapatkan penilaian cepat
                  dan rekomendasi langkah selanjutnya. serta bisa menjadi teman kamu untuk berbagi perasaan.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                {[
                  { icon: "🤖", text: "Tersedia 24/7 tanpa antrian" },
                  { icon: "⚡", text: "Respons instan dalam hitungan detik" },
                  { icon: "🔒", text: "Privasi terjamin dan anonim" },
                  { icon: "💡", text: "Rekomendasi berdasarkan riset terkini" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[#1E498E]/80">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="pt-6"
              >
                <motion.button
                  onClick={() => setShowStoryModal(true)}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-pink-600 transition-colors duration-300"
                >
                  Coba Sekarang
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-[#1E498E] mb-4">Tidak yakin mana yang tepat untuk Anda?</h3>
            <p className="text-[#1E498E]/80 mb-6">
              Mulai dengan AI Assistant untuk penilaian awal, lalu lanjutkan ke psikiater jika diperlukan
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#1E498E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1E498E]/90 transition-colors duration-300"
            >
              Mulai Assessment
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Story Mode Selection Modal */}
    <AnimatePresence>
      {showStoryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowStoryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#1E498E] mb-3">Pilih Mode Cerita</h3>
              <p className="text-[#1E498E]/70">Bagaimana kamu ingin berbagi cerita dengan TenJin?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Story Mode */}
              <Link href="/page/suaratenjin">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white cursor-pointer shadow-lg hover:shadow-2xl transition-shadow"
                >
                  <div className="text-5xl mb-4">🎤</div>
                  <h4 className="text-2xl font-bold mb-3">Cerita Suara</h4>
                  <p className="text-white/90 mb-4">
                    Berbicara langsung dengan TenJin menggunakan suara kamu
                  </p>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>✓ Lebih natural dan ekspresif</li>
                    <li>✓ Tidak perlu mengetik</li>
                    <li>✓ Respons real-time</li>
                  </ul>
                </motion.div>
              </Link>

              {/* Text Story Mode */}
              <Link href="/page/ceritatenjin">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-[#1E498E] to-blue-600 rounded-2xl p-8 text-white cursor-pointer shadow-lg hover:shadow-2xl transition-shadow"
                >
                  <div className="text-5xl mb-4">✍️</div>
                  <h4 className="text-2xl font-bold mb-3">Cerita Ketik</h4>
                  <p className="text-white/90 mb-4">
                    Tulis dan berbagi cerita kamu dengan mengetik
                  </p>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>✓ Lebih privat dan tenang</li>
                    <li>✓ Bisa diedit sebelum kirim</li>
                    <li>✓ Riwayat chat tersimpan</li>
                  </ul>
                </motion.div>
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStoryModal(false)}
              className="mt-6 w-full bg-gray-200 text-[#1E498E] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Tutup
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>
    
  );
}
