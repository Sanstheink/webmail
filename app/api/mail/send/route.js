import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, subject, html, text } = await req.json();

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'contact@yourdomain.com',
      to: [to],
      subject,
      html: html || `<p>${text}</p>`,
      text: text || '',
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
