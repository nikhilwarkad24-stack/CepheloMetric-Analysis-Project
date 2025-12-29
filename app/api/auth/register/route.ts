import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';
import { hashPassword } from '@/lib/password';
import jwt from 'jsonwebtoken';

type Body = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    const { name, email: rawEmail, password } = body;
    const email = (rawEmail || '').toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'User with that email already exists' }, { status: 409 });
    }

    const { salt, hash } = hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      passwordHash: hash,
      salt,
    });

    // Send welcome / account-creation email via EmailJS (if configured)
    try {
      const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
      const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
      const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID; // also called PUBLIC_KEY in EmailJS

      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_USER_ID) {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_USER_ID,
            template_params: {
              to_name: newUser.name,
              to_email: newUser.email,
            },
          }),
        });
      } else {
        console.warn('EmailJS not configured; skipping welcome email');
      }
    } catch (err) {
      console.error('Failed to send EmailJS welcome email', err);
    }

    // Issue JWT including tokenVersion
    const appToken = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email, name: newUser.name, photoURL: newUser.photoURL, role: newUser.role, tokenVersion: newUser.tokenVersion ?? 0 },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token: appToken,
    });

    response.cookies.set('auth_token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e: any) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
