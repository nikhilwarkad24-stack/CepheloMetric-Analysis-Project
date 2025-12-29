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
