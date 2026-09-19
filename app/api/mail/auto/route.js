import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. ตรวจสอบรหัสผ่านลับ (ป้องกันคนอื่นแอบยิง API)
    const authHeader = req.headers.get('authorization');
    const mySecret = process.env.AUTO_MAIL_SECRET; // ต้องไปตั้งค่าใน Vercel
    
    if (!authHeader || authHeader !== `Bearer ${mySecret}`) {
      return NextResponse.json({ error: 'Unauthorized: รหัสผ่าน API ไม่ถูกต้อง' }, { status: 401 });
    }

    // 2. รับข้อมูลจากเว็บอื่น
    const body = await req.json();
    const { to, subject, html, fromName = 'System' } = body;

    const mailgunDomain = 'tidalis.site';
    const mailgunApiKey = process.env.MAILGUN_API_KEY;

    // 3. เตรียมส่งให้ Mailgun
    const mailgunForm = new FormData();
    mailgunForm.append('from', `${fromName} <noreply@${mailgunDomain}>`); // ใช้อีเมล noreply สำหรับระบบอัตโนมัติ
    mailgunForm.append('to', to);
    mailgunForm.append('subject', subject);
    mailgunForm.append('html', html);

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

    return NextResponse.json({ success: true, message: 'ส่งอีเมลอัตโนมัติสำเร็จ' }, { status: 200 });

  } catch (error) {
    console.error("Auto Mail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
