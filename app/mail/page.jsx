'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Webmail() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // 🌟 State สำหรับระบบแจ้งเตือน (Toast Notification)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ฟังก์ชันเรียกใช้การแจ้งเตือน
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // ตั้งเวลาให้หายไปเองใน 4 วินาที
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        fetchEmails(session.user.email);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        fetchEmails(session.user.email);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function fetchEmails(userEmail) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      // ถ้าอยากให้เห็นของตัวเองเท่านั้น ให้เอาคอมเมนต์บรรทัดล่างออก
      // .or(`recipient.ilike.%${userEmail}%,sender.ilike.%${userEmail}%`)
      .order('created_at', { ascending: false });
      
    if (error) {
      showToast('ดึงข้อมูลไม่ได้: ' + error.message, 'error');
    } else if (data) {
      setEmails(data);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setSending(true);

    try {
      const formData = new FormData();
      formData.append('from', session.user.email);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', body);

      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        showToast('ส่งอีเมลสำเร็จ!', 'success');
        setTo('');
        setSubject('');
        setBody('');
        setFiles([]);
        setIsComposing(false);
        fetchEmails(session.user.email);
      } else {
        const errorText = await res.text();
        try {
          const errObj = JSON.parse(errorText);
          showToast('ส่งอีเมลล้มเหลว: ' + errObj.error, 'error');
        } catch (parseErr) {
          showToast('ระบบขัดข้อง: ' + errorText, 'error');
        }
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Initializing</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-white p-4 sm:p-6 lg:p-8 text-slate-800 font-sans selection:bg-indigo-200 selection:text-indigo-900 overflow-hidden relative">
      
      {/* 🌟 Toast Notification (Popup ด้านขวาล่าง) */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100 visible' : 'translate-y-10 opacity-0 invisible'}`}>
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/40 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold tracking-wide">{toast.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}</h4>
            <p className="text-xs font-medium opacity-90 mt-0.5 max-w-[250px]">{toast.message}</p>
          </div>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Main App Container */}
      <div className="max-w-[1440px] mx-auto h-[92vh] flex flex-col md:flex-row gap-6">
        
        {/* --- LEFT PANEL: INBOX & COMPOSE --- */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col gap-6 h-full shrink-0">
          
          {/* Header Card */}
          <div className="bg-white/60 backdrop-blur-2xl border border-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex justify-between items-center z-10 relative">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
                Tidalis
              </h1>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate max-w-[200px]">
                {session.user.email}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="ออกจากระบบ"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
              <button
                onClick={() => setIsComposing(!isComposing)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 ${isComposing ? 'bg-slate-800 rotate-45 shadow-slate-900/20' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-600/30'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          {/* Compose Form */}
          <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-[0_20px_40px_rgb(0,0,0,0.06)] ${isComposing ? 'max-h-[700px] opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0 border-transparent shadow-none'}`}>
            <div className="p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">New Message</h2>
              <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
                <div className="flex border-b border-slate-100 pb-2 transition-colors focus-within:border-indigo-400">
                  <span className="text-slate-400 text-sm font-medium w-12 pt-1">To:</span>
                  <input type="email" required value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none" placeholder="recipient@example.com" />
                </div>
                <div className="flex border-b border-slate-100 pb-2 transition-colors focus-within:border-indigo-400">
                  <span className="text-slate-400 text-sm font-medium w-12 pt-1">Sub:</span>
                  <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none" placeholder="What's this about?" />
                </div>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all h-32 resize-none mt-2" placeholder="Write your message here... (HTML allowed)"></textarea>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="relative overflow-hidden inline-block group">
                    <button type="button" className="flex items-center gap-2 text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      {files.length > 0 ? `${files.length} file(s)` : 'Attach'}
                    </button>
                    <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                  
                  <button type="submit" disabled={sending} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center gap-2">
                    {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Send Mail'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Inbox List */}
          <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col overflow-hidden relative">
            <div className="p-5 pb-3 border-b border-slate-100/50 flex justify-between items-center bg-white/40">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Inbox</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{emails.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <span className="text-sm font-medium">No messages yet</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {emails.map((mail) => {
                    const isSelected = selectedEmail?.id === mail.id;
                    return (
                      <div
                        key={mail.id}
                        onClick={() => setSelectedEmail(mail)}
                        className={`group relative p-5 cursor-pointer transition-all duration-300 border-b border-slate-50 last:border-0
                          ${isSelected ? 'bg-indigo-50/50' : 'bg-transparent hover:bg-white'}
                        `}
                      >
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"></div>}
                        
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                            ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                            {mail.sender_name ? mail.sender_name.charAt(0).toUpperCase() : '@'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className={`font-semibold text-sm truncate pr-2 transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                {mail.sender_name || mail.sender.split('@')[0]}
                              </span>
                              {mail.attachments?.length > 0 && (
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              )}
                            </div>
                            <div className={`text-sm truncate font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                              {mail.subject || '(No Subject)'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-1">
                              {new Date(mail.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT PANEL: EMAIL VIEWER --- */}
        <div className="w-full md:flex-1 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col h-full relative z-0">
          {selectedEmail ? (
            <div className="h-full flex flex-col animate-[fadeSlideIn_0.4s_ease-out]">
              
              {/* Email Header */}
              <div className="p-8 pb-6 border-b border-slate-100">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                  {selectedEmail.subject}
                </h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner shrink-0 border border-white">
                      {selectedEmail.sender_name ? selectedEmail.sender_name.charAt(0).toUpperCase() : '@'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-base">{selectedEmail.sender_name}</div>
                      <div className="text-sm text-slate-500 font-medium">
                        <span className="text-slate-400 font-normal">From:</span> {selectedEmail.sender}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-right">
                    <div>{new Date(selectedEmail.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="mt-0.5">{new Date(selectedEmail.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })} น.</div>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[#fafcff]">
                <div
                  className="prose prose-slate prose-a:text-indigo-600 hover:prose-a:text-indigo-800 max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }}
                />

                {/* Attachments Section */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-16 pt-8 border-t border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Attachments ({selectedEmail.attachments.length})
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedEmail.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center p-2 pr-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300 w-full sm:w-auto min-w-[200px]"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0 transition-transform group-hover:bg-indigo-600 group-hover:text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-700">{file.name || `File ${idx + 1}`}</p>
                            <p className="text-xs text-slate-400 font-medium">{file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Download'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State (No Email Selected)
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 p-8 text-center">
              <div className="w-32 h-32 mb-8 relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-indigo-100">
                  <svg className="w-16 h-16 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">ยังไม่ได้เลือกข้อความ</h3>
              <p className="text-sm text-slate-500 max-w-sm">เลือกอีเมลจากกล่องข้อความทางซ้ายมือ เพื่อแสดงเนื้อหาและไฟล์แนบที่นี่</p>
            </div>
          )}
        </div>

      </div>
      
      {/* CSS สำหรับ Scrollbar และ Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(15px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
