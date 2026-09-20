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

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
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
      // คอมเมนต์ไว้เพื่อดูอีเมลทั้งหมดตามเดิม
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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1A1A1A] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    // 🌟 พื้นหลังที่มีสีสันสดใสแบบ Abstract Glassmorphism
    <div className="min-h-screen relative flex items-center justify-center p-2 sm:p-6 overflow-hidden bg-[#e0f2fe]">
      {/* Decorative Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-cyan-300/40 to-blue-400/40 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-purple-300/40 to-pink-300/40 blur-[120px]"></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-yellow-100/40 to-orange-200/40 blur-[80px]"></div>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 invisible'}`}>
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md ${toast.type === 'success' ? 'bg-[#1C1C1C] text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex-1 pr-4">
            <h4 className="text-sm font-bold">{toast.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}</h4>
            <p className="text-xs font-medium opacity-80 mt-1">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* Main Glass Container */}
      <div className="w-full max-w-[1600px] h-[92vh] bg-white/40 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgb(0,0,0,0.08)] border border-white/60 flex overflow-hidden p-2 relative z-10 gap-2">
        
        {/* --- 1. DARK SIDEBAR --- */}
        <div className="w-16 bg-[#1A1A1A] rounded-[24px] flex flex-col items-center py-6 justify-between shrink-0 shadow-lg relative z-20">
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Logo placeholder */}
            <div className="text-white font-extrabold tracking-tighter text-sm -rotate-90 mt-4 mb-4">TIDALIS</div>
            
            {/* Icons */}
            <button className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </button>
          </div>
          
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="ออกจากระบบ">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        {/* --- 2. SUB MENU --- */}
        <div className="w-48 flex flex-col pt-6 px-3 shrink-0">
          <h2 className="text-[22px] font-bold text-slate-900 px-3 mb-6">Email</h2>
          
          <div className="flex flex-col gap-1">
            <button className="flex items-center justify-between px-3 py-2.5 bg-white shadow-sm rounded-xl text-sm font-bold text-slate-900 border border-white/60 relative">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                Inbox
              </div>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{emails.length}</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              Important
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Sent
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Drafts
            </button>
          </div>

          <h3 className="text-xs font-bold text-slate-900 px-3 mt-10 mb-4">Folders</h3>
          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              Add Folder
            </button>
          </div>
        </div>

        {/* --- 3. INBOX LIST --- */}
        <div className="w-[320px] lg:w-[380px] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[24px] flex flex-col overflow-hidden shrink-0">
          
          <div className="p-5 border-b border-white/50">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[22px] font-bold text-slate-900">Inbox</h2>
              <button 
                onClick={() => { setIsComposing(true); setSelectedEmail(null); }}
                className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-black transition-transform hover:scale-105 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            {/* Search Pill */}
            <div className="relative mb-4">
              <svg className="absolute left-4 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search" className="w-full bg-white/60 border border-white/40 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all placeholder:text-slate-400" />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 bg-white/50 p-1 rounded-full border border-white/40">
              <button className="flex-1 bg-[#1A1A1A] text-white text-xs font-semibold py-1.5 rounded-full shadow-sm">All</button>
              <button className="flex-1 text-slate-600 text-xs font-semibold py-1.5 rounded-full hover:bg-white/50 transition-colors">Read</button>
              <button className="flex-1 text-slate-600 text-xs font-semibold py-1.5 rounded-full hover:bg-white/50 transition-colors">Unread</button>
            </div>
          </div>
          
          {/* Email Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 font-medium">No messages</div>
            ) : (
              emails.map((mail, idx) => {
                const isSelected = selectedEmail?.id === mail.id;
                // สุ่มจุดเขียวจำลอง (Unread) สำหรับ UI
                const isUnread = idx === 0 || idx === 2; 

                return (
                  <div
                    key={mail.id}
                    onClick={() => { setSelectedEmail(mail); setIsComposing(false); }}
                    className={`relative p-5 border-b border-white/30 cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-white shadow-sm rounded-xl m-2 border-transparent' : 'hover:bg-white/30'}
                    `}
                  >
                    <div className="flex items-start gap-3 relative">
                      {isUnread && !isSelected && <div className="absolute -left-2 top-1.5 w-2 h-2 bg-green-500 rounded-full"></div>}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold text-[15px] truncate pr-2 ${isSelected ? 'text-[#1A1A1A]' : 'text-slate-800'}`}>
                            {mail.sender_name || mail.sender.split('@')[0]}
                          </span>
                          <span className="text-[12px] font-medium text-slate-500 shrink-0">
                            {new Date(mail.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute:'2-digit' })}
                          </span>
                        </div>
                        <div className="text-[14px] font-medium text-slate-800 mb-1 truncate">
                          {mail.subject || '(No Subject)'}
                        </div>
                        <div className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                          {mail.body_text || 'Open to view message content...'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- 4. MAIN VIEW (Compose or View) --- */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[24px] flex flex-col overflow-hidden relative z-0">
          
          {isComposing ? (
            // 📝 Compose View
            <div className="h-full flex flex-col animate-[fadeIn_0.3s_ease-out]">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">New Message</h2>
                <button onClick={() => setIsComposing(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto">
                <form onSubmit={handleSendEmail} className="flex flex-col h-full gap-4 max-w-3xl mx-auto">
                  <div className="flex items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-400 text-sm font-semibold w-16">To:</span>
                    <input type="email" required value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 bg-transparent text-slate-800 focus:outline-none" />
                  </div>
                  <div className="flex items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-400 text-sm font-semibold w-16">Subject:</span>
                    <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent text-slate-800 font-medium focus:outline-none" />
                  </div>
                  
                  <textarea required value={body} onChange={(e) => setBody(e.target.value)} className="flex-1 w-full bg-transparent p-2 text-slate-700 focus:outline-none resize-none mt-4 leading-relaxed" placeholder="Type your message here..."></textarea>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                    <div className="relative group">
                      <button type="button" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {files.length > 0 ? `${files.length} File(s)` : 'Attach'}
                      </button>
                      <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    <button type="submit" disabled={sending} className="bg-[#1A1A1A] text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50">
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          ) : selectedEmail ? (
            // 📖 Read View
            <div className="h-full flex flex-col animate-[fadeIn_0.3s_ease-out]">
              {/* Toolbar */}
              <div className="px-8 py-4 border-b border-slate-100/60 flex items-center gap-6 text-sm font-semibold text-slate-600 bg-white/30">
                <button className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Reply</button>
                <button className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg> Forward</button>
                <div className="w-px h-4 bg-slate-300"></div>
                <button className="flex items-center gap-2 hover:text-red-600 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete</button>
                <button className="flex items-center gap-2 hover:text-yellow-600 transition-colors ml-auto"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> Important</button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                {/* Email Header */}
                <div className="flex items-start gap-4 mb-10">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shrink-0">
                    <img src={`https://ui-avatars.com/api/?name=${selectedEmail.sender_name || 'U'}&background=random`} alt="Avatar" className="w-full h-full rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <h3 className="font-bold text-lg text-slate-900">{selectedEmail.sender_name || selectedEmail.sender.split('@')[0]}</h3>
                      <span className="text-sm font-medium text-slate-500">
                        {new Date(selectedEmail.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-[13px] text-slate-500">
                      <span className="font-medium text-slate-700">To:</span> {selectedEmail.recipient}
                    </div>
                  </div>
                </div>

                {/* Email Subject & Body */}
                <h1 className="text-[26px] font-bold text-slate-900 mb-6">{selectedEmail.subject}</h1>
                <div
                  className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-[15px]"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }}
                />

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-12 pt-6 border-t border-slate-200">
                    <div className="flex flex-wrap gap-3">
                      {selectedEmail.attachments.map((file, idx) => (
                        <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 pr-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{file.name}</p>
                            <p className="text-xs font-medium text-slate-500">{file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Attachment'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 🛑 Empty State
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Select an item to read</h3>
              <p className="text-sm">Nothing is selected</p>
            </div>
          )}
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); }
      `}} />
    </div>
  );
}
