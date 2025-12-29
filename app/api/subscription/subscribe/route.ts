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

    const body = await request.json();
    const subscriptionStatus = body.subscriptionStatus as string;
    const analysisLimit = body.analysisLimit;

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Validate subscriptionStatus before assigning
    if (subscriptionStatus === 'free' || subscriptionStatus === 'standard' || subscriptionStatus === 'premium') {
      user.subscriptionStatus = subscriptionStatus as 'free' | 'standard' | 'premium';
    } else {
      user.subscriptionStatus = 'free';
    }

    // analysisLimit can be a number or null for "unlimited"; cast for TypeScript compatibility
    user.analysisLimit = typeof analysisLimit === 'number' ? analysisLimit : (null as any);
    await user.save();

    return NextResponse.json({ success: true, subscriptionStatus: user.subscriptionStatus, analysisLimit: user.analysisLimit });
  } catch (err: any) {
    console.error('Subscription update failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
