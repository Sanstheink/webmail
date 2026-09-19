import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ใช้ Service Role Key เพื่อสิทธิ์ในการเขียนข้อมูล
);

export async function POST(req) {
  try {
    // โค้ดนี้รับ Webhook จากผู้ให้บริการ (เช่น ForwardEmail หรือ Mailgun)
    // โครงสร้าง Payload จะต่างกันนิดหน่อยตามผู้ให้บริการ อันนี้เป็นโครงสร้างมาตรฐาน
    const payload = await req.json();

    const { error } = await supabase
      .from('emails')
      .insert({
        sender: payload.from || payload.sender,
        sender_name: payload.from_name || payload.from,
        recipient: payload.to || payload.recipient,
        subject: payload.subject || '(No Subject)',
        body_html: payload.html || payload.html_body,
        body_text: payload.text || payload.text_body,
        is_unread: true,
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
