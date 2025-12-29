import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify and decode token
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as {
      userId: string;
      email: string;
      name: string;
      photoURL?: string;
      role: string;
      tokenVersion?: number;
    };

    // Ensure tokenVersion matches current user record
    await connectDB();
    const user = await User.findById(payload.userId).select('tokenVersion role name email photoURL');
    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        photoURL: payload.photoURL,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth verification failed:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
