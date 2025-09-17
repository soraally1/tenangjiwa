'use client';

import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-[70vh] pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-[#1E498E] mb-6">Daftar</h1>
      <form className="bg-white/70 backdrop-blur-md rounded-2xl border border-black/10 p-6 space-y-4">
        <div>
          <label className="block text-sm text-black/70 mb-1">Nama</label>
          <input type="text" className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1E498E]/40 bg-white" placeholder="Nama lengkap" />
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Email</label>
          <input type="email" className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1E498E]/40 bg-white" placeholder="you@mail.com" />
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Kata sandi</label>
          <input type="password" className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1E498E]/40 bg-white" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-[#1E498E] text-white py-2 rounded-lg hover:opacity-95">Daftar</button>
        <p className="text-sm text-black/60 text-center">Sudah punya akun? <Link href="/page/login" className="text-[#1E498E] underline">Masuk</Link></p>
      </form>
    </main>
  );
}


