"use client"

import type React from "react"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signupWithEmail, signupWithGoogle, validateEmail, validatePassword, validateName } from "../../service/signupservice"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const router = useRouter()

  useEffect(() => {
    // Clear error when form data changes
    if (error) setError("")
  }, [formData, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate name
    const nameValidation = validateName(formData.name)
    if (!nameValidation.isValid) {
      setError(nameValidation.message!)
      return
    }

    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      setError(emailValidation.message!)
      return
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message!)
      return
    }

    setIsLoading(true)
    
    try {
      const result = await signupWithEmail(formData.name, formData.email, formData.password)
      
      if (result.success) {
        // Redirect to home page on successful signup
        router.push("/")
      } else {
        setError(result.error!)
      }
    } catch {
      setError("Terjadi kesalahan yang tidak terduga")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setIsGoogleLoading(true)
    
    try {
      const result = await signupWithGoogle()
      
      if (result.success) {
        // Redirect to home page on successful signup
        router.push("/")
      } else {
        setError(result.error!)
      }
    } catch {
      setError("Terjadi kesalahan yang tidak terduga")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getProgressCount = () => {
    let count = 0
    if (formData.name.trim()) count++
    if (formData.email.trim()) count++
    if (formData.password.trim()) count++
    return count
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF3E0] via-[#B3E5FC] to-[#FFF3E0] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-32 right-16 w-28 h-28 bg-[#FFF3E0]/40 rounded-full blur-xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 left-16 w-36 h-36 bg-[#B3E5FC]/30 rounded-full blur-xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1E498E] mb-2">Daftar</h1>
          <p className="text-[#1E498E]/70">Bergabunglah dengan kami!</p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/50 shadow-2xl p-8"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-[#1E498E] mb-2">Nama</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full rounded-xl border-2 border-[#B3E5FC]/50 px-4 py-3 outline-none focus:border-[#1E498E] focus:ring-4 focus:ring-[#1E498E]/20 bg-white/70 text-[#1E498E] placeholder-[#1E498E]/50 transition-all duration-300"
                placeholder="Nama lengkap"
                required
              />
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-[#1E498E] mb-2">Email</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full rounded-xl border-2 border-[#B3E5FC]/50 px-4 py-3 outline-none focus:border-[#1E498E] focus:ring-4 focus:ring-[#1E498E]/20 bg-white/70 text-[#1E498E] placeholder-[#1E498E]/50 transition-all duration-300"
                placeholder="you@mail.com"
                required
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-[#1E498E] mb-2">Kata sandi</label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#B3E5FC]/50 px-4 py-3 pr-12 outline-none focus:border-[#1E498E] focus:ring-4 focus:ring-[#1E498E]/20 bg-white/70 text-[#1E498E] placeholder-[#1E498E]/50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1E498E]/60 hover:text-[#1E498E] transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </motion.button>
                {formData.password && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            formData.password.length >= level * 2
                              ? level <= 2
                                ? "bg-red-400"
                                : level === 3
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(30, 73, 142, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1E498E] to-[#1E498E]/80 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                />
              ) : (
                "Daftar"
              )}
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="relative my-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1E498E]/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 text-[#1E498E]/60">atau</span>
              </div>
            </motion.div>

            {/* Google Signup Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full"
                />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Daftar dengan Google
                </>
              )}
            </motion.button>

            {/* Login link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-[#1E498E]/70 text-center"
            >
              Sudah punya akun?{" "}
              <Link
                href="/page/login"
                className="text-[#1E498E] font-semibold hover:underline transition-all duration-300"
              >
                Masuk
              </Link>
            </motion.p>
          </form>
        </motion.div>

        {/* Footer decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  getProgressCount() > index ? "bg-[#1E498E] shadow-lg shadow-[#1E498E]/30" : "bg-[#1E498E]/20"
                }`}
                animate={{
                  scale: getProgressCount() > index ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xs text-[#1E498E]/50 mt-2"
          >
            {getProgressCount()}/3 fields completed
          </motion.p>
        </motion.div>
      </motion.main>
    </div>
  )
}
