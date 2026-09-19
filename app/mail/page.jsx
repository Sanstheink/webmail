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
  
  // State สำหรับฟอร์มส่งอีเมล
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  // ดึงรายการอีเมลจาก Supabase
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

  // ฟังก์ชันส่งอีเมลพร้อมไฟล์แนบ
  async function handleSendEmail(e) {
    e.preventDefault();
    setSending(true);

    try {
      const formData = new FormData();
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', body);

      // แนบไฟล์ลง FormData
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('ส่งอีเมลสำเร็จ!');
        setTo('');
        setSubject('');
        setBody('');
        setFiles([]);
        fetchEmails(); // โหลดรายการอีเมลใหม่
      } else {
        const err = await res.json();
        alert('ส่งอีเมลล้มเหลว: ' + err.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      {/* ฝั่งซ้าย: กล่องข้อความและเขียนอีเมล */}
      <div className="w-1/2 flex flex-col gap-4">
        {/* ฟอร์มเขียนอีเมล */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-3">✉️ เขียนอีเมลใหม่</h2>
          <form onSubmit={handleSendEmail} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="ถึง (Email ปลายทาง)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="หัวข้อ"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2 border rounded"
              required
            />
            <textarea
              placeholder="ข้อความ..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="p-2 border rounded h-24"
              required
            />
            {/* ช่องเลือกไฟล์แนบ */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">แนบไฟล์ (รูปภาพ/เอกสาร):</label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {sending ? 'กำลังส่ง...' : 'ส่งอีเมล'}
            </button>
          </form>
        </div>

        {/* รายการอีเมลในกล่องข้อความ */}
        <div className="bg-white p-4 rounded-xl shadow flex-1 overflow-y-auto">
          <h2 className="text-lg font-bold mb-3">📥 กล่องข้อความ</h2>
          <div className="flex flex-col gap-2">
            {emails.map((mail) => (
              <div
                key={mail.id}
                onClick={() => setSelectedEmail(mail)}
                className={`p-3 border rounded cursor-pointer hover:bg-blue-50 transition ${
                  selectedEmail?.id === mail.id ? 'bg-blue-100 border-blue-400' : ''
                }`}
              >
                <div className="flex justify-between font-semibold text-sm">
                  <span>{mail.sender_name || mail.sender}</span>
                  {mail.attachments?.length > 0 && <span>📎</span>}
                </div>
                <div className="text-sm text-gray-800 font-medium truncate">{mail.subject}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: รายละเอียดอีเมลที่เลือก */}
      <div className="w-1/2 bg-white p-6 rounded-xl shadow overflow-y-auto">
        {selectedEmail ? (
          <div>
            <h1 className="text-xl font-bold mb-2">{selectedEmail.subject}</h1>
            <div className="text-sm text-gray-500 border-b pb-3 mb-4">
              <div><strong>จาก:</strong> {selectedEmail.sender_name} ({selectedEmail.sender})</div>
              <div><strong>ถึง:</strong> {selectedEmail.recipient}</div>
            </div>

            {/* เนื้อหาอีเมล */}
            <div
              className="prose max-w-none text-gray-800 mb-6"
              dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }}
            />

            {/* แสดงไฟล์แนบ (ถ้ามี) */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold text-sm text-gray-700 mb-2">
                  📎 ไฟล์แนบ ({selectedEmail.attachments.length} ไฟล์)
                </p>
                <div className="flex flex-col gap-2">
                  {selectedEmail.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 bg-white border rounded text-sm text-blue-600 hover:bg-blue-50 transition"
                    >
                      <span className="truncate">{file.name || `ไฟล์แนบ ${idx + 1}`}</span>
                      <span className="text-xs text-gray-400 ml-2">เปิดดู/ดาวน์โหลด ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            เลือกอีเมลทางซ้ายเพื่อเปิดอ่าน
          </div>
        )}
      </div>
    </div>
  );
}
