'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Webmail() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  async function fetchEmails() {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setEmails(data);
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setSending(true);

    try {
      const formData = new FormData();
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
        alert('✨ ส่งอีเมลสำเร็จ!');
        setTo('');
        setSubject('');
        setBody('');
        setFiles([]);
        setIsComposing(false);
        fetchEmails();
      } else {
        const err = await res.json();
        alert('❌ ส่งอีเมลล้มเหลว: ' + err.error);
      }
    } catch (err) {
      alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    // พื้นหลังแบบ Gradient เคลื่อนไหวช้าๆ
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4 sm:p-6 lg:p-8 text-slate-800 font-sans selection:bg-blue-200">
      <div className="max-w-7xl mx-auto h-[90vh] flex flex-col md:flex-row gap-6">
        
        {/* --- ฝั่งซ้าย: เมนู และ กล่องข้อความ --- */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 h-full">
          
          {/* Header & Compose Button */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-5 rounded-3xl shadow-lg shadow-blue-900/5 flex justify-between items-center transition-all">
            <div>
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Tidalis Mail
              </h1>
              <p className="text-sm text-slate-500 font-medium">จัดการอีเมลของคุณ</p>
            </div>
            <button
              onClick={() => setIsComposing(!isComposing)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isComposing ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Form เขียนอีเมล (มี Animation เปิด/ปิด) */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isComposing ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-xl shadow-blue-900/10">
              <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">✉️ เขียนจดหมายใหม่</h2>
              <form onSubmit={handleSendEmail} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="ถึง (Email ปลายทาง)"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
                  required
                />
                <input
                  type="text"
                  placeholder="หัวเรื่อง"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
                  required
                />
                <textarea
                  placeholder="พิมพ์ข้อความของคุณที่นี่..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all h-28 resize-none"
                  required
                />
                <div className="relative group">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="mt-2 w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังส่ง...
                    </>
                  ) : 'ส่งอีเมล'}
                </button>
              </form>
            </div>
          </div>

          {/* รายการอีเมล (Inbox) */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-2 rounded-3xl shadow-lg shadow-blue-900/5 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 pb-2">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">📥 กล่องข้อความ</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {emails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => setSelectedEmail(mail)}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    selectedEmail?.id === mail.id 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20 translate-x-1' 
                      : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm truncate pr-2 ${selectedEmail?.id === mail.id ? 'text-white' : 'text-slate-900'}`}>
                      {mail.sender_name || mail.sender}
                    </span>
                    {mail.attachments?.length > 0 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs truncate ${selectedEmail?.id === mail.id ? 'text-blue-100' : 'text-slate-500'}`}>
                    {mail.subject}
                  </div>
                </div>
              ))}
              {emails.length === 0 && (
                <div className="text-center text-slate-400 mt-10 text-sm">
                  ไม่มีอีเมลในกล่องจดหมาย
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- ฝั่งขวา: รายละเอียดอีเมล --- */}
        <div className="w-full md:w-2/3 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-xl shadow-blue-900/10 overflow-hidden flex flex-col h-full relative">
          {selectedEmail ? (
            <div className="h-full flex flex-col animate-[fadeIn_0.3s_ease-out]">
              {/* Email Header */}
              <div className="p-8 pb-6 border-b border-slate-100 bg-white/50">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 leading-tight">
                  {selectedEmail.subject}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-inner">
                    {selectedEmail.sender_name ? selectedEmail.sender_name[0].toUpperCase() : '@'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{selectedEmail.sender_name}</div>
                    <div className="text-sm text-slate-500">{selectedEmail.sender}</div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    ถึง: {selectedEmail.recipient}
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div
                  className="prose prose-slate prose-blue max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }}
                />

                {/* Attachments Section */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-12 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      ไฟล์แนบ ({selectedEmail.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedEmail.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-700">{file.name || `ไฟล์ที่ ${idx + 1}`}</p>
                            <p className="text-xs text-slate-400">{file.size ? Math.round(file.size / 1024) + ' KB' : 'Download'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-pulse">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">ยังไม่ได้เลือกอีเมล</h3>
              <p className="text-sm max-w-xs">เลือกอีเมลจากกล่องข้อความทางซ้ายมือเพื่ออ่านรายละเอียดที่นี่</p>
            </div>
          )}
        </div>

      </div>
      
      {/* เพิ่ม Style สำหรับ Scrollbar และ Animation เล็กน้อย */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
