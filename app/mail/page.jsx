'use client';

import React, { useState, useEffect } from 'react';
import { Inbox, Send, Search, Reply, MailOpen, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase Client สำหรับฝั่ง Frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WebmailDashboard() {
  const [emails, setEmails] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [currentTab, setCurrentTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingStatus, setSendingStatus] = useState(null);

  // ดึงอีเมลจาก Database เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchEmails();
  }, [currentTab]);

  const fetchEmails = async () => {
    // ถ้าอยู่หน้า Inbox ให้ดึงเมลที่ส่งหาเรา, ถ้าอยู่หน้า Sent ให้ดึงเมลที่เราส่งออก
    const recipientFilter = currentTab === 'inbox' 
      ? { column: 'recipient', value: 'contact@tidalis.site' } // อีเมลโดเมนคุณ
      : { column: 'sender', value: 'contact@tidalis.site' };
      
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq(recipientFilter.column, recipientFilter.value)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEmails(data);
    }
  };

  const filteredEmails = emails.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMail = async (mail) => {
    setSelectedMail(mail);
    
    // อัปเดตสถานะเป็น "อ่านแล้ว" ใน Database
    if (mail.is_unread) {
      await supabase
        .from('emails')
        .update({ is_unread: false })
        .eq('id', mail.id);
      
      setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, is_unread: false } : m));
    }
    setCurrentTab('inbox');
  };

  const handleReplyClick = (mail) => {
    setCurrentTab('compose');
    setComposeTo(mail.sender);
    setComposeSubject(`Re: ${mail.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${mail.sender_name} <${mail.sender}>\nDate: ${new Date(mail.created_at).toLocaleString()}\n\n`);
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    setSendingStatus('sending');

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          html: `<p>${composeBody.replace(/\n/g, '<br/>')}</p>`,
          text: composeBody,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      // บันทึกอีเมลที่ส่งออกลง Database ด้วย จะได้โชว์ในหน้า Sent
      await supabase
        .from('emails')
        .insert({
          sender: 'contact@tidalis.site',
          sender_name: 'Me',
          recipient: composeTo,
          subject: composeSubject,
          body_html: `<p>${composeBody.replace(/\n/g, '<br/>')}</p>`,
          body_text: composeBody,
          is_unread: false,
        });

      setSendingStatus('sent');
      setTimeout(() => {
        setSendingStatus(null);
        setCurrentTab('inbox');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        fetchEmails(); // รีเฟรชข้อมูลใหม่
      }, 1000);
    } catch {
      setSendingStatus('error');
    }
  };

  // ... (ส่วน UI <div className="flex h-screen..."> ยังเหมือนเดิมทุกประการ ไม่ต้องแก้ครับ แต่เปลี่ยนการอ้างอิงตัวแปรนิดหน่อย เช่น mail.html เปลี่ยนเป็น mail.body_html) ...
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">W</div>
          <span className="font-bold text-slate-900 tracking-tight">DomainMail UI</span>
        </div>
        <button 
          onClick={() => { setCurrentTab('compose'); setSelectedMail(null); }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 mb-6"
        >
          <Send size={16} /> Compose
        </button>
        <nav className="space-y-1 flex-1">
          <button 
            onClick={() => { setCurrentTab('inbox'); setSelectedMail(null); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'inbox' && !selectedMail ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-3"><Inbox size={18} /> Inbox</div>
          </button>
          <button 
            onClick={() => { setCurrentTab('sent'); setSelectedMail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'sent' && !selectedMail ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Send size={18} /> Sent
          </button>
        </nav>
      </aside>

      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredEmails.map((mail) => (
            <div 
              key={mail.id}
              onClick={() => handleSelectMail(mail)}
              className={`p-4 cursor-pointer transition hover:bg-slate-50 ${selectedMail?.id === mail.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''} ${mail.is_unread ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs truncate ${mail.is_unread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{mail.sender_name || mail.sender}</span>
                <span className="text-[10px] text-slate-400">{new Date(mail.created_at).toLocaleDateString()}</span>
              </div>
              <div className={`text-sm truncate mb-1 ${mail.is_unread ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{mail.subject}</div>
              <div className="text-xs text-slate-400 truncate">{mail.body_text}</div>
            </div>
          ))}
          {filteredEmails.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 mt-4">No emails found</div>
          )}
        </div>
      </div>

      <main className="flex-1 bg-white flex flex-col overflow-y-auto">
        {currentTab === 'compose' ? (
          <div className="max-w-3xl w-full mx-auto p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6">New Message</h2>
            <form onSubmit={handleSendMail} className="space-y-4">
              <input type="email" required placeholder="To" value={composeTo} onChange={e => setComposeTo(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm" />
              <input type="text" required placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm" />
              <textarea rows={8} required placeholder="Body" value={composeBody} onChange={e => setComposeBody(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm font-mono" />
              <button type="submit" disabled={sendingStatus === 'sending'} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {sendingStatus === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
              {sendingStatus === 'sent' && <span className="ml-4 text-emerald-600 text-sm flex items-center gap-1 inline-flex"><CheckCircle2 size={16} /> Sent!</span>}
            </form>
          </div>
        ) : selectedMail ? (
          <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between pb-6 border-b mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">{selectedMail.subject}</h1>
                <span className="text-sm text-slate-500">{selectedMail.sender_name} &lt;{selectedMail.sender}&gt;</span>
              </div>
              <button onClick={() => handleReplyClick(selectedMail)} className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2">
                <Reply size={16} /> Reply
              </button>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMail.body_html || selectedMail.body_text?.replace(/\n/g, '<br/>') }} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <MailOpen size={48} className="mb-4 stroke-[1.5]" />
            <p className="text-sm">Select an email to read</p>
          </div>
        )}
      </main>
    </div>
  );
}
