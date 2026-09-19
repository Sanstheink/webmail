import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const sender = formData.get('from') || 'unknown@sender.com';
    const recipient = formData.get('To') || formData.get('recipient') || 'contact@tidalis.site';
    const subject = formData.get('subject') || '(No Subject)';
    const bodyHtml = formData.get('body-html') || '';
    const bodyText = formData.get('body-plain') || '';

    // สกัดชื่อและอีเมล
    let senderName = sender;
    let cleanSenderEmail = sender;
    const match = sender.match(/(.*)<(.*)>/);
    if (match) {
      senderName = match[1].trim() || match[2].trim();
      cleanSenderEmail = match[2].trim();
    }

    // --- จัดการไฟล์แนบ ---
    const attachmentCount = parseInt(formData.get('attachment-count') || '0');
    const attachmentUrls = [];

    for (let i = 1; i <= attachmentCount; i++) {
      const file = formData.get(`attachment-${i}`);
      if (file && file.size > 0) {
        // ตั้งชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำ
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        
        // อัปโหลดขึ้น Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file);

        if (!uploadError) {
          // ดึง URL แบบ Public
          const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);
          
          attachmentUrls.push({
            name: file.name,
            url: publicUrlData.publicUrl,
            size: file.size,
            type: file.type
          });
        }
      }
    }

    // บันทึกลงตาราง emails พร้อมลิงก์ไฟล์แนบ
    const { error: dbError } = await supabase
      .from('emails')
      .insert({
        sender: cleanSenderEmail,
        sender_name: senderName,
        recipient: recipient,
        subject: subject,
        body_html: bodyHtml,
        body_text: bodyText,
        is_unread: true,
        attachments: attachmentUrls // บันทึกเป็น JSON
      });

    if (dbError) throw dbError;
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
