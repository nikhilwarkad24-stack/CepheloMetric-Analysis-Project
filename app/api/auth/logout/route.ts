import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  try {
    // If there is a token, verify and increment tokenVersion to invalidate existing tokens
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
        if (payload?.userId) {
          await connectDB();
          // Increment tokenVersion so existing tokens become invalid
          await User.findByIdAndUpdate(payload.userId, { $inc: { tokenVersion: 1 } });
        }
      } catch (e) {
        // ignore verification errors here
      }
    }
  } catch (e) {
    console.error('Error invalidating token on logout:', e);
  }

  // Clear the auth_token cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });

  return response;
}
