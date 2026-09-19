import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const to = formData.get('to');
    const subject = formData.get('subject');
    const text = formData.get('text');
    const html = formData.get('html');
    const files = formData.getAll('attachments'); // รับไฟล์ทั้งหมดที่แนบมา
    
    const mailgunDomain = 'tidalis.site'; // โโดเมนของคุณ
    const mailgunApiKey = process.env.MAILGUN_API_KEY; 
    
    // สร้าง FormData สำหรับส่งให้ Mailgun
    const mailgunForm = new FormData();
    mailgunForm.append('from', `Contact <contact@${mailgunDomain}>`);
    mailgunForm.append('to', to);
    mailgunForm.append('subject', subject);
    if (text) mailgunForm.append('text', text);
    if (html) mailgunForm.append('html', html);

    const attachmentRecords = [];

    // วนลูปจัดการไฟล์แนบ
    for (const file of files) {
      if (file && file.size > 0) {
        // 1. แนบไฟล์ส่งไปที่ Mailgun
        mailgunForm.append('attachment', file);

        // 2. อัปโหลดเก็บไว้ใน Supabase เพื่อแสดงในหน้าเว็บเมลของเรา
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);
          attachmentRecords.push({
            name: file.name,
            url: urlData.publicUrl,
            size: file.size
          });
        }
      }
    }

    // ยิง API ไปที่ Mailgun
    const basicAuth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');
    const mailgunRes = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      body: mailgunForm,
    });

    if (!mailgunRes.ok) {
      const errorText = await mailgunRes.text();
      throw new Error(`Mailgun Error: ${errorText}`);
    }

    // บันทึกประวัติการส่งลง Database
    await supabase.from('emails').insert({
      sender: `contact@${mailgunDomain}`,
      sender_name: 'Me',
      recipient: to,
      subject: subject,
      body_html: html || text,
      body_text: text,
      is_unread: false,
      attachments: attachmentRecords // เก็บประวัติไฟล์ที่ส่งไป
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Send Mail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
