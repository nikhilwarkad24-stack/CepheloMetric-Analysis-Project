import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    const body = await request.json();
    const plan = (body.plan as string) || 'standard';

    // currently only support standard and premium
    const amountMap: Record<string, number> = {
      standard: 1000 * 100, // paise
      premium: 3000 * 100,
    };

    const amount = amountMap[plan] ?? amountMap['standard'];

    await connectDB();
    const user = await User.findById(payload.userId).select('email name');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const receipt = `receipt_${payload.userId}_${Date.now()}`;

    // Create Razorpay order
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: { userId: payload.userId, plan },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Razorpay order creation failed', txt);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const data = await resp.json();

    return NextResponse.json({ success: true, order: data, keyId: RAZORPAY_KEY_ID });
  } catch (err: any) {
    console.error('Create order failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
