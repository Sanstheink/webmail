'use client';

import React, { useState } from 'react';
import { 
  Inbox, Send, Search, Reply, MailOpen, CheckCircle2 
} from 'lucide-react';

const INITIAL_EMAILS = [
  {
    id: 1,
    sender: 'alex@partner.com',
    senderName: 'Alex Mercer',
    recipient: 'contact@yourdomain.com',
    subject: 'Project OACD Q3 Roadmap & Review',
    date: '10:45 AM',
    unread: true,
    html: `<div style="font-family: sans-serif; color: #333;"><p>Hi team,</p><p>Here is the update regarding the <strong>OACD roadmap</strong> review for Q3.</p></div>`,
    text: 'Hi team, Here is the update regarding the OACD roadmap review for Q3.'
  }
];

export default function WebmailDashboard() {
  const [emails, setEmails] = useState(INITIAL_EMAILS);
  const [selectedMail, setSelectedMail] = useState(null);
  const [currentTab, setCurrentTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingStatus, setSendingStatus] = useState(null);

  const filteredEmails = emails.filter(m => 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMail = (mail) => {
    setSelectedMail(mail);
    setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, unread: false } : m));
    setCurrentTab('inbox');
  };

  const handleReplyClick = (mail) => {
    setCurrentTab('compose');
    setComposeTo(mail.sender);
    setComposeSubject(`Re: ${mail.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${mail.sender}\n\n`);
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

      const newMail = {
        id: Date.now(),
        sender: 'contact@yourdomain.com',
        senderName: 'Me',
        recipient: composeTo,
        subject: composeSubject,
        date: 'Just now',
        unread: false,
        html: `<p>${composeBody.replace(/\n/g, '<br/>')}</p>`,
        text: composeBody
      };
      setEmails(prev => [newMail, ...prev]);
      setSendingStatus('sent');
      setTimeout(() => {
        setSendingStatus(null);
        setCurrentTab('inbox');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
      }, 1000);
    } catch {
      setSendingStatus('error');
    }
  };

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
            onClick={() => setCurrentTab('sent')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'sent' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
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
              className={`p-4 cursor-pointer transition hover:bg-slate-50 ${selectedMail?.id === mail.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 truncate">{mail.senderName}</span>
                <span className="text-[10px] text-slate-400">{mail.date}</span>
              </div>
              <div className="text-sm text-slate-900 truncate mb-1">{mail.subject}</div>
              <div className="text-xs text-slate-400 truncate">{mail.text}</div>
            </div>
          ))}
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
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
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
                <span className="text-sm text-slate-500">{selectedMail.senderName} &lt;{selectedMail.sender}&gt;</span>
              </div>
              <button onClick={() => handleReplyClick(selectedMail)} className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2">
                <Reply size={16} /> Reply
              </button>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMail.html }} />
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
