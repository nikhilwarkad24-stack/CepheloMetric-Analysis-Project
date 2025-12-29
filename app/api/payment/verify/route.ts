import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

function verifySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Optionally, verify JWT (not strictly needed if we rely on order notes to map user) but do it for safety
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Fetch order details to read the notes (plan and userId)
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    const resp = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}` },
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Failed to fetch order details', txt);
      return NextResponse.json({ error: 'Failed to verify order' }, { status: 500 });
    }

    const order = await resp.json();
    const notes = order.notes || {};
    const userId = notes.userId as string | undefined;
    const plan = notes.plan as string | undefined;

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Order missing user data' }, { status: 400 });
    }

    if (userId !== payload.userId) {
      return NextResponse.json({ error: 'Order does not belong to authenticated user' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Idempotency: if a payment with this paymentId already exists, don't create another
    try {
      const { Payment } = await import('@/lib/mongodb');
      const existing = await Payment.findOne({ paymentId: razorpay_payment_id });
      if (existing) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      if (plan === 'standard') {
        user.subscriptionStatus = 'standard';
        user.analysisLimit = 100;
      } else if (plan === 'premium') {
        user.subscriptionStatus = 'premium';
        user.analysisLimit = (null as any);
      }

      await user.save();

      await Payment.create({
        userId: user._id,
        method: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: order.amount,
        currency: order.currency,
        plan,
        status: 'captured',
      });
    } catch (err) {
      console.error('Failed to create payment / apply subscription', err);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Verify payment failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
