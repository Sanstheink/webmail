import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// เอาคำว่า default ออกแล้ว เป็น export async function POST แทน
export async function POST(req) {
  try {
    const formData = await req.formData();
    // รับค่า 'from' ที่ส่งมาจากหน้าเว็บ
    const fromEmail = formData.get('from') || 'contact@tidalis.site'; 
    const to = formData.get('to');
    const subject = formData.get('subject');
    const html = formData.get('html');
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
    if (html) mailgunForm.append('html', html);

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
    
    // ⚠️ หมายเหตุ: ถ้า Mailgun ของคุณอยู่โซนยุโรป ให้เปลี่ยน api.mailgun.net เป็น api.eu.mailgun.net
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

    await supabase.from('emails').insert({
      sender: fromEmail, 
      sender_name: senderName,
      recipient: to,
      subject: subject,
      body_html: html,
      body_text: html,
      is_unread: false,
      attachments: attachmentRecords
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Outbound Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
