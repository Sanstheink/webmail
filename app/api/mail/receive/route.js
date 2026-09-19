import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// เชื่อมต่อ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    // Mailgun ส่งข้อมูลมาเป็น FormData
    const formData = await req.formData();
    
    // ดึงข้อมูลฟิลด์ต่างๆ จาก Mailgun
    const sender = formData.get('from') || 'unknown@sender.com';
    const recipient = formData.get('To') || formData.get('recipient') || 'contact@tidalis.site';
    const subject = formData.get('subject') || '(No Subject)';
    const bodyHtml = formData.get('body-html') || '';
    const bodyText = formData.get('body-plain') || '';

    // สกัดชื่อผู้ส่งและอีเมลออกจากรูปแบบ "Name <email@domain.com>"
    let senderName = sender;
    let cleanSenderEmail = sender;
    const match = sender.match(/(.*)<(.*)>/);
    if (match) {
      senderName = match[1].trim() || match[2].trim();
      cleanSenderEmail = match[2].trim();
    }

    // บันทึกลงฐานข้อมูล Supabase ตาราง emails
    const { error } = await supabase
      .from('emails')
      .insert({
        sender: cleanSenderEmail,
        sender_name: senderName,
        recipient: recipient,
        subject: subject,
        body_html: bodyHtml,
        body_text: bodyText,
        is_unread: true, // ตั้งค่าเริ่มต้นให้เป็นอีเมลที่ยังไม่อ่าน
      });

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
    
    // ส่ง Status 200 กลับไปบอก Mailgun ว่ารับข้อมูลสำเร็จแล้ว (สำคัญมาก)
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
