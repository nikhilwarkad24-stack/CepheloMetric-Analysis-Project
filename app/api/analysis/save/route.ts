import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Analysis } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    const body = await request.json();
    const { title, landmarks, analysis: analysisData, meta } = body;

    // Prevent overly large payloads
    const approxSize = JSON.stringify({ landmarks, analysis: analysisData, meta }).length;
    if (approxSize > 200_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }

    await connectDB();
    const doc = await Analysis.create({ userId: payload.userId, title: title || 'Analysis', landmarks, analysis: analysisData, meta });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err: any) {
    console.error('Save analysis failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
