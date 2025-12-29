import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sendEmailJS } from '@/lib/emailjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { role?: string };
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { subject, message, to_email, to_name } = body;
    if (!subject || !message || !to_email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Basic validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(to_email))) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

    if (String(subject).length > 200 || String(message).length > 4000) {
      return NextResponse.json({ error: 'Subject or message too long' }, { status: 400 });
    }

    try {
      await sendEmailJS({ subject, message, to_email, to_name });
    } catch (err: any) {
      console.error('sendEmailJS failed', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin send email failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}