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
  const [errorMsg, setErrorMsg] = useState(''); // เพิ่ม State สำหรับเก็บข้อความ Error
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(''); // เคลียร์ Error เดิมก่อนกดล็อกอินใหม่

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // ตรวจสอบและแสดงข้อความแจ้งเตือนที่ดูเป็นมิตรขึ้น
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      } else {
        setErrorMsg('เกิดข้อผิดพลาด: ' + error.message);
      }
      setLoading(false);
    } else {
      router.push('/'); 
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-white flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      
      <div className="w-full max-w-[400px] bg-white/60 backdrop-blur-2xl border border-white p-8 sm:p-10 rounded-[32px] shadow-[0_20px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
        
        {/* Decorative Element */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-slate-500/10 blur-xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Tidalis Mail
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Sign in to manage your workspace
            </p>
          </div>

          {/* 🌟 กล่องแจ้งเตือน Error แบบ Custom */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 animate-[shake_0.4s_ease-in-out]">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(''); // เคลียร์ Error ทันทีที่เริ่มพิมพ์ใหม่
                }}
                className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400 ${errorMsg ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                placeholder="name@tidalis.site"
                required
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(''); // เคลียร์ Error ทันทีที่เริ่มพิมพ์ใหม่
                }}
                className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400 ${errorMsg ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-900 disabled:transform-none flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      
      {/* เพิ่ม Keyframes สำหรับ Animation สั่น */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}} />
    </div>
  );
}
