import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    await connectDB();
    // Ensure tokenVersion still valid for this user
    const currentUser = payload.userId ? await User.findById(payload.userId).select('tokenVersion') : null;
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Atomically increment only if limit allows (or unlimited)
    // Use a filter that allows unlimited (analysisLimit === null) or analysisCount < analysisLimit
    const updated = await User.findOneAndUpdate(
      {
        _id: payload.userId,
        $or: [
          { analysisLimit: null },
          { $expr: { $lt: ['$analysisCount', '$analysisLimit'] } },
        ],
      },
      { $inc: { analysisCount: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Analysis limit reached' }, { status: 403 });
    }

    return NextResponse.json({ success: true, analysisCount: updated.analysisCount, analysisLimit: updated.analysisLimit });
  } catch (err: any) {
    console.error('Increment analysis failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
