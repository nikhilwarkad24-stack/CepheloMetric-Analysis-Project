'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleServerSubscribe = async () => {
    setLoading(true);
    try {
      // Create a Razorpay order on the server
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'standard' }),
      });

      const data = await res.json();
      if (!res.ok || !data.order) throw new Error('Failed to create order');

      const order = data.order;
      const keyId = data.keyId;

      // Load Razorpay checkout script if not already loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay script'));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Ceph Studio',
        description: 'Standard Plan — 100 analyses',
        order_id: order.id,
        handler: async (response: any) => {
          // Verify the payment on the server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            toast({ title: 'Subscribed', description: 'Your account has been upgraded to Standard (100 analyses).' });
            router.push('/studio');
          } catch (err) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Verification failed. Please contact support.' });
          }
        },
        prefill: {
          name: '',
        },
        notes: {},
        theme: { color: '#111827' },
      } as any;

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Subscription Failed', description: 'Could not complete subscription. If you signed in with Firebase, use the Studio subscription UI.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Choose a plan</h1>
      <p className="text-muted-foreground mb-8">Your free trial includes 3 analyses. Upgrade to continue using the studio and enable downloads.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col">
          <h3 className="text-xl font-bold">Standard</h3>
          <p className="text-muted-foreground mt-1 mb-4 text-sm">100 analyses, reporting & downloads.</p>
          <p className="text-4xl font-extrabold my-2">₹1000</p>
          <p className="text-muted-foreground text-sm">One-time payment</p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground flex-1">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary"/> 100 Analyses</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary"/> Full Reporting & Downloads</li>
          </ul>
          <div className="mt-6">
            <Button onClick={handleServerSubscribe} disabled={loading} className="w-full">{loading ? 'Processing...' : 'Checkout (Razorpay)'}</Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col border-2 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-primary-foreground bg-primary rounded-bl-lg">Upcoming</div>
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">Premium <Sparkles className="w-5 h-5"/></h3>
          <p className="text-muted-foreground mt-1 mb-4 text-sm">Unlimited analyses plus AI prediction, problem identification and summaries. Coming soon.</p>
          <p className="text-4xl font-extrabold my-2">₹3000</p>
          <p className="text-muted-foreground text-sm">One-time payment — upcoming</p>
          <div className="mt-6">
            <Button disabled className="w-full">Coming Soon</Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <p>If you signed in using Firebase, please upgrade from within the Studio UI (click "Upgrade"). If you used local/email sign-in, the button above will upgrade your account immediately (server-side).</p>
        <p className="mt-2">Need help? <Link href="/support" className="text-primary underline">Contact support</Link></p>
      </div>
    </div>
  );
}
