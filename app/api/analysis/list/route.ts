import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Analysis } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    await connectDB();
    const docs = await Analysis.find({ userId: payload.userId }).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ success: true, analyses: docs });
  } catch (err: any) {
    console.error('List analyses failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
