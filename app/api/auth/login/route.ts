import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';
import { verifyPassword } from '@/lib/password';
import jwt from 'jsonwebtoken';

type Body = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    const email = (body.email || '').toLowerCase();
    const { password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (e: any) {
      console.error('Login - DB connection error:', e);
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

    const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') } });
    if (!user || !user.passwordHash || !user.salt) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = verifyPassword(password, user.salt, user.passwordHash as string);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const appToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, photoURL: user.photoURL, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
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
    console.error('Login error:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
