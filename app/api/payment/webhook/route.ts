import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error('Webhook secret not configured');
      return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 });
    }

    const payloadText = await request.text();
    const signatureHeader = request.headers.get('x-razorpay-signature') || '';

    const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(payloadText).digest('hex');
    if (expected !== signatureHeader) {
      console.warn('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(payloadText);
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      // Extract order id
      const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
      if (!orderId) return NextResponse.json({ success: true });

      // Fetch order to get notes
      const resp = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: { Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}` },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Failed to fetch order from webhook', txt);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
      }

      const order = await resp.json();
      const notes = order.notes || {};
      const userId = notes.userId as string | undefined;
      const plan = notes.plan as string | undefined;

      if (userId && plan) {
        await connectDB();
        const user = await User.findById(userId);
        if (user) {
          if (plan === 'standard') {
            user.subscriptionStatus = 'standard';
            user.analysisLimit = 100;
          } else if (plan === 'premium') {
            user.subscriptionStatus = 'premium';
            user.analysisLimit = (null as any);
          }
          await user.save();

          try {
            const paymentEntity = payload.payload?.payment?.entity;
            const paymentId = paymentEntity?.id;
            const amount = paymentEntity?.amount;
            const currency = paymentEntity?.currency;
            const { Payment } = await import('@/lib/mongodb');

            // Idempotency: if paymentId already recorded, skip duplicate
            if (paymentId) {
              const existing = await Payment.findOne({ paymentId });
              if (existing) {
                return NextResponse.json({ success: true, message: 'Duplicate webhook' });
              }
            }

            await Payment.create({
              userId: user._id,
              method: 'razorpay',
              orderId,
              paymentId,
              amount,
              currency,
              plan,
              status: event,
            });
          } catch (err) {
            console.error('Failed to create payment record from webhook', err);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook handling failed', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
