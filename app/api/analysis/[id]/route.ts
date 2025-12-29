import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { Analysis } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    const id = params.id;
    await connectDB();
    const doc = await Analysis.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (doc.userId.toString() !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, analysis: doc });
  } catch (err: any) {
    console.error('Get analysis failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
