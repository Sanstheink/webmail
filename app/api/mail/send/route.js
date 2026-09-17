// app/api/mail/send/route.js
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, subject, html, text } = await req.json();

    const data = await resend.emails.send({
      from: 'you@yourdomain.com',
      to: [to],
      subject,
      html,
      text,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
