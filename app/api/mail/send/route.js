import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const fromEmail = formData.get('from') || 'contact@tidalis.site'; 
    const to = formData.get('to');
    const subject = formData.get('subject');
    
    // ดึงเนื้อหาข้อความ
    const rawHtml = formData.get('html') || '';
    
    // 🛠️ FIX 1: สร้างเวอร์ชัน Plain Text (ลบแท็ก HTML ออกให้หมด)
    const plainText = rawHtml.replace(/<[^>]*>?/gm, '');
    
    // 🛠️ FIX 2: ห่อด้วยโครงสร้างแท็ก HTML มาตรฐาน
    const properHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${rawHtml}</body></html>`;

    const files = formData.getAll('attachments');
    
    const mailgunDomain = 'tidalis.site';
    const mailgunApiKey = process.env.MAILGUN_API_KEY;

    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY is missing in Environment Variables.');
    }
    
    const senderName = fromEmail.split('@')[0];

    const mailgunForm = new FormData();
    mailgunForm.append('from', `${senderName} <${fromEmail}>`);
    mailgunForm.append('to', to);
    mailgunForm.append('subject', subject);
    
    // แนบไปทั้ง 2 ฟอร์แมต
    mailgunForm.append('text', plainText);
    mailgunForm.append('html', properHtml);

    const attachmentRecords = [];

    for (const file of files) {
      if (file && file.size > 0) {
        mailgunForm.append('attachment', file);

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

    // บันทึกประวัติการส่งลง Supabase
    await supabase.from('emails').insert({
      sender: fromEmail, 
      sender_name: senderName,
      recipient: to,
      subject: subject,
      body_html: properHtml,
      body_text: plainText,
      is_unread: false,
      attachments: attachmentRecords
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Outbound Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
