'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useState } from 'react';
import { LoaderCircle, Gem, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

type SubscriptionPlan = 'standard' | 'premium';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (plan: SubscriptionPlan) => Promise<void>;
}

export function SubscriptionDialog({ open, onOpenChange, onSubscribe }: SubscriptionDialogProps) {
  const [isSubscribing, setIsSubscribing] = useState<SubscriptionPlan | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setIsSubscribing(plan);
    try {
      await onSubscribe(plan);
    } finally {
      setIsSubscribing(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl">
            <Gem className="w-7 h-7 text-primary" /> Upgrade Your Plan
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've used all your free analyses. Choose a plan to continue unlocking insights with Ceph Studio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <Card className="p-6 flex flex-col">
                <h3 className="text-xl font-bold text-foreground">Standard</h3>
                <p className="text-muted-foreground mt-1 mb-4 text-sm">Access to Ceph Studio with reporting and downloads. Good for clinicians who need up to 100 analyses.</p>
                <p className="text-4xl font-extrabold my-2">₹1000</p>
                <p className="text-muted-foreground text-sm">One-time payment — includes 100 analyses</p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground flex-1">
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> 100 Analyses</li>
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> Full Reporting & Downloads</li>
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> Image & CSV Export</li>
                </ul>
                <Button onClick={() => handleSubscribe('standard')} disabled={!!isSubscribing} className="w-full mt-6">
                    {isSubscribing === 'standard' ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Subscribe to Standard
                </Button>
            </Card>

             <Card className="p-6 flex flex-col border-2 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-primary-foreground bg-primary rounded-bl-lg">Upcoming</div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">Premium <Sparkles className="w-5 h-5"/></h3>
                <p className="text-muted-foreground mt-1 mb-4 text-sm">Unlimited analyses, AI landmark prediction, problem identification and summaries. This plan is coming soon.</p>
                <p className="text-4xl font-extrabold my-2">₹3000</p>
                <p className="text-muted-foreground text-sm">One-time payment — upcoming</p>
                 <ul className="mt-6 space-y-2 text-sm text-muted-foreground flex-1">
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> Unlimited Analyses (Upcoming)</li>
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> AI Landmark Detection (Upcoming)</li>
                    <li className='flex items-center gap-2'><CheckCircle2 className="w-4 h-4 text-primary"/> Problem ID & Summary (Upcoming)</li>
                </ul>
                <Button disabled className="w-full mt-6" title="Coming soon">
                    Coming soon
                </Button>
            </Card>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


