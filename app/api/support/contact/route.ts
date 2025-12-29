import { NextRequest, NextResponse } from 'next/server';
import { sendEmailJS } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, email, name } = body;

    if (!subject || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (String(subject).length > 200 || String(message).length > 4000) {
      return NextResponse.json({ error: 'Subject or message too long' }, { status: 400 });
    }

    // basic email validation if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(String(email))) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

    try {
      await sendEmailJS({
        subject,
        message,
        from_email: email || 'noreply@example.com',
        from_name: name || 'User',
      });
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('EmailJS failed', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Support contact failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
