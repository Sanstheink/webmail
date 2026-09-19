'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ฟังก์ชันล็อกอินด้วย Email
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('❌ เข้าสู่ระบบล้มเหลว: ' + error.message);
      setLoading(false);
    } else {
      router.push('/'); 
    }
  }

  // ฟังก์ชันล็อกอินด้วย Discord
  async function handleDiscordLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/`, // ล็อกอินเสร็จให้เด้งกลับมาหน้าเว็บเมล
      }
    });
    if (error) {
      alert('❌ เข้าสู่ระบบด้วย Discord ล้มเหลว: ' + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] shadow-xl shadow-blue-900/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            Tidalis Mail
          </h1>
          <p className="text-slate-500 text-sm">เข้าสู่ระบบเพื่อจัดการกล่องข้อความ</p>
        </div>

        {/* ปุ่มล็อกอินด้วย Discord */}
        <button
          onClick={handleDiscordLogin}
          type="button"
          className="w-full mb-6 flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#5865F2]/30 hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          เข้าสู่ระบบด้วย Discord
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-sm text-slate-400 font-medium">หรือใช้อีเมล</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* ฟอร์มล็อกอินด้วย Email เดิม */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300 shadow-lg disabled:opacity-70"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
