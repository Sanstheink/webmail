'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 🌐 พจนานุกรมแปลภาษาแบบง่าย
const DICT = {
  en: {
    inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', folders: 'Folders',
    newMsg: 'New Message', search: 'Search', all: 'All',
    to: 'To:', sub: 'Subject:', attach: 'Attach', send: 'Send',
    reply: 'Reply', forward: 'Forward', noMsg: 'No messages',
    selectMsg: 'Select an item to read', settings: 'Settings', save: 'Save'
  },
  th: {
    inbox: 'กล่องข้อความ', sent: 'ส่งแล้ว', drafts: 'ฉบับร่าง', folders: 'โฟลเดอร์',
    newMsg: 'เขียนข้อความ', search: 'ค้นหา', all: 'ทั้งหมด',
    to: 'ถึง:', sub: 'หัวเรื่อง:', attach: 'แนบไฟล์', send: 'ส่งอีเมล',
    reply: 'ตอบกลับ', forward: 'ส่งต่อ', noMsg: 'ไม่มีข้อความ',
    selectMsg: 'เลือกข้อความเพื่ออ่าน', settings: 'การตั้งค่า', save: 'บันทึก'
  }
};

export default function Webmail() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // ⚙️ ตัวแปรสำหรับ Settings
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        // ดึงการตั้งค่าจาก Metadata ของผู้ใช้
        const meta = session.user.user_metadata;
        if (meta?.theme) setTheme(meta.theme);
        if (meta?.language) setLang(meta.language);
        if (meta?.avatar_url) setAvatarUrl(meta.avatar_url);
        fetchEmails(session.user.email);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        const meta = session.user.user_metadata;
        if (meta?.theme) setTheme(meta.theme);
        if (meta?.language) setLang(meta.language);
        if (meta?.avatar_url) setAvatarUrl(meta.avatar_url);
        fetchEmails(session.user.email);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function fetchEmails(userEmail) {
    const { data, error } = await supabase.from('emails').select('*').order('created_at', { ascending: false });
    if (!error && data) setEmails(data);
  }

  const filteredEmails = emails.filter(mail => {
    const userEmail = session?.user?.email || '';
    if (currentFolder === 'inbox') return mail.recipient.includes(userEmail) && !mail.is_draft;
    if (currentFolder === 'sent') return mail.sender.includes(userEmail) && !mail.is_draft;
    if (currentFolder === 'drafts') return mail.sender.includes(userEmail) && mail.is_draft;
    return true;
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // ⚙️ ฟังก์ชันเปลี่ยนการตั้งค่า
  const updateSettings = async (newTheme, newLang) => {
    setTheme(newTheme);
    setLang(newLang);
    await supabase.auth.updateUser({ data: { theme: newTheme, language: newLang } });
  };

  // 📸 ฟังก์ชันอัปโหลดรูปโปรไฟล์
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
      showToast(lang === 'th' ? 'อัปเดตรูปสำเร็จ' : 'Avatar updated!', 'success');
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReply = () => { /* ... ฟังก์ชันเดิม ... */ };
  const handleForward = () => { /* ... ฟังก์ชันเดิม ... */ };
  const handleSaveDraft = async () => { /* ... ฟังก์ชันเดิม ... */ };
  const resetCompose = () => { setTo(''); setSubject(''); setBody(''); setFiles([]); setDraftId(null); setIsComposing(false); };

  async function handleSendEmail(e) {
    e.preventDefault();
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('from', session.user.email);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', body.replace(/\n/g, '<br>'));
      for (let i = 0; i < files.length; i++) formData.append('attachments', files[i]);

      const res = await fetch('/api/mail/send', { method: 'POST', body: formData });
      if (res.ok) {
        showToast(lang === 'th' ? 'ส่งสำเร็จ' : 'Sent successfully', 'success');
        if (draftId) await supabase.from('emails').delete().eq('id', draftId);
        resetCompose();
        fetchEmails(session.user.email);
      } else {
        const errorText = await res.text();
        showToast('Error: ' + errorText, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  const handleEmailClick = (mail) => {
    if (mail.is_draft) {
      setTo(mail.recipient); setSubject(mail.subject !== '(ไม่มีหัวเรื่อง)' ? mail.subject : ''); setBody(mail.body_text); setDraftId(mail.id); setIsComposing(true); setSelectedEmail(null);
    } else {
      setSelectedEmail(mail); setIsComposing(false); setDraftId(null);
    }
  };

  if (loadingAuth) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-slate-600 border-t-white rounded-full animate-spin"></div></div>;
  if (!session) return null;

  const t = DICT[lang]; // ดึงคำแปลตามภาษาที่เลือก
  const isDark = theme === 'dark'; // เช็คธีม

  // ค่าสี Dynamic ตาม Theme
  const bgApp = isDark ? 'bg-slate-950' : 'bg-[#e0f2fe]';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const glassPanel = isDark ? 'bg-slate-900/50 border-slate-700/60' : 'bg-white/40 border-white/60';
  const innerPanel = isDark ? 'bg-slate-800/80' : 'bg-white/70';
  const hoverClass = isDark ? 'hover:bg-white/10' : 'hover:bg-white/40';

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-2 sm:p-6 overflow-hidden ${bgApp} transition-colors duration-500`}>
      {/* Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] ${isDark ? 'bg-indigo-900/30' : 'bg-cyan-300/40'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] ${isDark ? 'bg-purple-900/20' : 'bg-pink-300/40'}`}></div>

      {/* 🌟 SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className={`w-full max-w-md p-8 rounded-[32px] shadow-2xl relative ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-white text-slate-900'} border`}>
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h2 className="text-2xl font-bold mb-6">{t.settings}</h2>
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-8">
              <div 
                onClick={() => fileInputRef.current.click()} 
                className="w-24 h-24 rounded-full bg-slate-200 cursor-pointer relative group overflow-hidden shadow-inner mb-3 flex items-center justify-center"
              >
                {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-slate-400">{session.user.email.charAt(0).toUpperCase()}</span>}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
              <p className="text-sm font-medium">{session.user.email}</p>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl flex justify-between items-center ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <span className="font-semibold text-sm">Theme</span>
                <div className="flex bg-slate-200/50 rounded-full p-1 gap-1">
                  <button onClick={() => updateSettings('light', lang)} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${!isDark ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Light</button>
                  <button onClick={() => updateSettings('dark', lang)} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${isDark ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-500'}`}>Dark</button>
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl flex justify-between items-center ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <span className="font-semibold text-sm">Language</span>
                <div className="flex bg-slate-200/50 rounded-full p-1 gap-1">
                  <button onClick={() => updateSettings(theme, 'en')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${lang === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>EN</button>
                  <button onClick={() => updateSettings(theme, 'th')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${lang === 'th' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>TH</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Glass Container */}
      <div className={`w-full max-w-[1600px] h-[92vh] ${glassPanel} backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgb(0,0,0,0.08)] border flex overflow-hidden p-2 relative z-10 gap-2 transition-colors duration-500`}>
        
        {/* --- 1. DARK SIDEBAR --- */}
        <div className="w-16 bg-[#1A1A1A] rounded-[24px] flex flex-col items-center py-6 justify-between shrink-0 shadow-lg relative z-20">
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-white font-extrabold tracking-tighter text-sm -rotate-90 mt-4 mb-4">TIDALIS</div>
            
            {/* Profile Avatar Button (เปิด Settings) */}
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center hover:scale-105 transition-transform overflow-hidden shadow-lg border-2 border-[#1A1A1A]">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{session.user.email.charAt(0).toUpperCase()}</span>}
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex justify-center items-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors flex justify-center items-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>

        {/* --- 2. SUB MENU --- */}
        <div className="w-48 flex flex-col pt-6 px-3 shrink-0">
          <h2 className={`text-[22px] font-bold ${textMain} px-3 mb-6`}>Email</h2>
          
          <div className="flex flex-col gap-1">
            <button onClick={() => setCurrentFolder('inbox')} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${currentFolder === 'inbox' ? `${isDark ? 'bg-slate-700' : 'bg-white shadow-sm'} font-bold ${textMain}` : `font-medium ${textSub}${hoverClass}`}`}>
              <div className="flex items-center gap-3"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> {t.inbox}</div>
            </button>
            <button onClick={() => setCurrentFolder('sent')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${currentFolder === 'sent' ? `${isDark ? 'bg-slate-700' : 'bg-white shadow-sm'} font-bold ${textMain}` : `font-medium ${textSub}${hoverClass}`}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> {t.sent}
            </button>
            <button onClick={() => setCurrentFolder('drafts')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${currentFolder === 'drafts' ? `${isDark ? 'bg-slate-700' : 'bg-white shadow-sm'} font-bold ${textMain}` : `font-medium ${textSub}${hoverClass}`}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> {t.drafts}
            </button>
          </div>
        </div>

        {/* --- 3. INBOX LIST --- */}
        <div className={`w-[320px] lg:w-[380px] ${glassPanel} backdrop-blur-xl rounded-[24px] flex flex-col overflow-hidden shrink-0`}>
          <div className="p-5 border-b border-white/20">
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-[22px] font-bold ${textMain} capitalize`}>{t[currentFolder] || currentFolder}</h2>
              <button onClick={() => { resetCompose(); setIsComposing(true); }} className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-black transition-transform shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">{t.noMsg}</div>
            ) : (
              filteredEmails.map((mail) => {
                const isSelected = selectedEmail?.id === mail.id || (isComposing && draftId === mail.id);
                return (
                  <div key={mail.id} onClick={() => handleEmailClick(mail)} className={`relative p-5 border-b border-white/10 cursor-pointer transition-all duration-200 ${isSelected ? `${isDark ? 'bg-slate-700 shadow-sm border-transparent' : 'bg-white shadow-sm border-transparent'} rounded-xl m-2` : hoverClass}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-semibold text-[15px] truncate pr-2 ${isSelected ? textMain : textMain}`}>
                          {currentFolder === 'sent' || mail.is_draft ? `${t.to} ${mail.recipient || '...'}` : (mail.sender_name || mail.sender.split('@')[0])}
                        </span>
                        <span className="text-[12px] font-medium text-slate-400 shrink-0">{new Date(mail.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div className={`text-[14px] font-medium ${textSub} mb-1 truncate`}>{mail.is_draft && <span className="text-red-400 font-bold mr-1">[ร่าง]</span>}{mail.subject || '...'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- 4. MAIN VIEW --- */}
        <div className={`flex-1 ${innerPanel} backdrop-blur-xl border border-white/20 rounded-[24px] flex flex-col overflow-hidden relative z-0 transition-colors`}>
          {isComposing ? (
            // 📝 Compose View
            <div className="h-full flex flex-col">
              <div className="px-8 py-5 border-b border-slate-200/50 flex justify-between items-center">
                <h2 className={`text-xl font-bold ${textMain}`}>{t.newMsg}</h2>
                <button onClick={() => setIsComposing(false)} className={`${textSub} hover:text-red-500`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <form onSubmit={handleSendEmail} className="flex flex-col h-full gap-4 max-w-3xl mx-auto">
                  <div className="flex items-center border-b border-slate-200/50 pb-2">
                    <span className={`text-sm font-semibold w-16 ${textSub}`}>{t.to}</span>
                    <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className={`flex-1 bg-transparent focus:outline-none ${textMain}`} />
                  </div>
                  <div className="flex items-center border-b border-slate-200/50 pb-2">
                    <span className={`text-sm font-semibold w-20 ${textSub}`}>{t.sub}</span>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={`flex-1 bg-transparent font-medium focus:outline-none ${textMain}`} />
                  </div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} className={`flex-1 w-full bg-transparent p-2 focus:outline-none resize-none mt-4 leading-relaxed ${textMain}`} placeholder="..."></textarea>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 mt-auto">
                    <div className="flex gap-2">
                      <div className="relative group">
                        <button type="button" className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-600'} px-4 py-2 rounded-full shadow-sm`}>{t.attach}</button>
                        <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={handleSaveDraft} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-semibold">{t.save}</button>
                      <button type="submit" disabled={sending} className="bg-blue-600 text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{t.send}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedEmail ? (
            // 📖 Read View
            <div className="h-full flex flex-col">
              <div className={`px-8 py-4 border-b border-slate-200/50 flex items-center gap-6 text-sm font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/30 text-slate-600'}`}>
                <button onClick={() => { setTo(selectedEmail.sender); setSubject(`Re: ${selectedEmail.subject}`); setBody(''); setIsComposing(true); }} className="flex items-center gap-2 hover:text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> {t.reply}</button>
                <button onClick={() => { setTo(''); setSubject(`Fwd: ${selectedEmail.subject}`); setBody(`\n\n--- Forwarded ---\n${selectedEmail.body_text}`); setIsComposing(true); }} className="flex items-center gap-2 hover:text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg> {t.forward}</button>
              </div>
              <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="flex items-start gap-4 mb-10">
                  <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-lg shrink-0 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${selectedEmail.sender_name || 'U'}&background=random`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <h3 className={`font-bold text-lg ${textMain}`}>{selectedEmail.sender_name || selectedEmail.sender.split('@')[0]}</h3>
                      <span className="text-sm font-medium text-slate-400">{new Date(selectedEmail.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className={`text-[13px] ${textSub}`}>To: {selectedEmail.recipient}</div>
                  </div>
                </div>
                <h1 className={`text-[26px] font-bold ${textMain} mb-6`}>{selectedEmail.subject}</h1>
                <div className={`prose max-w-none leading-relaxed text-[15px] ${isDark ? 'prose-invert text-slate-300' : 'text-slate-800'}`} dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }} />
              </div>
            </div>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center ${textSub}`}><h3 className="text-lg font-bold">{t.selectMsg}</h3></div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${isDark ? '#475569' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }`}} />
    </div>
  );
}
