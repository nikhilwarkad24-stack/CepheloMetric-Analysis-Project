import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';
import { hashPassword } from '@/lib/password';
import jwt from 'jsonwebtoken';
import { sendEmailJS } from '@/lib/emailjs';

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

    // Basic server-side validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields: name, email and password are required' }, { status: 400 });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 422 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 422 });
    }

    try {
      await connectDB();
    } catch (e: any) {
      console.error('Registration - DB connection error:', e);
      const msg = String(e?.message || e);
      if (msg.includes('ECONNREFUSED') || msg.includes('ServerSelectionError')) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
      } else if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('bad auth')) {
        return NextResponse.json({ error: 'Database authentication failed. Check MONGODB_URI credentials and Atlas IP whitelist.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Database error', details: process.env.NODE_ENV === 'development' ? msg : undefined }, { status: 500 });
    }

    function escapeRegExp(s: string) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const existing = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') } });
    if (existing) {
      return NextResponse.json({ error: 'User with that email already exists' }, { status: 409 });
    }

    const { salt, hash } = hashPassword(password);

    let newUser;
    try {
      newUser = await User.create({
        name,
        email,
        passwordHash: hash,
        salt,
        // Default trial subscription / usage limits
        subscriptionStatus: 'free',
        analysisCount: 0,
        analysisLimit: 3,
      });
    } catch (err: any) {
      // Handle duplicate key race or validation errors
      console.error('User.create error', { message: err?.message, code: err?.code });
      if (err?.code === 11000) {
        return NextResponse.json({ error: 'User with that email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Send welcome / account-creation email via EmailJS (if configured)
    try {
      await sendEmailJS({
        to_name: newUser.name,
        to_email: newUser.email,
        app_origin: process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000',
      });
    } catch (err) {
      // Log but do not fail the signup if email sending misconfigures
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
        photoURL: newUser.photoURL,
        subscriptionStatus: newUser.subscriptionStatus ?? 'free',
        analysisLimit: newUser.analysisLimit ?? 3,
        analysisCount: newUser.analysisCount ?? 0,
      },
      token: appToken,
    });

    // Use NextResponse cookie helper; keep same API used elsewhere in codebase
    response.cookies.set('auth_token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e: any) {
    console.error('Registration error:', e?.message || e);
    // Provide a safer error message to clients
    return NextResponse.json({ error: e?.message ? String(e.message) : 'Internal server error during registration' }, { status: 500 });
  }
}
