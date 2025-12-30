'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, clearAuthStorage, type UserData } from '@/lib/auth';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Settings, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  useAuthProtection();
  const { toast } = useToast();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverUser, setServerUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [supportState, setSupportState] = useState({ subject: '', message: '', sending: false });
  const router = useRouter();

  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);

    // Try to fetch server-side user info (includes subscription and usage)
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setServerUser(data.user);

          // Fetch analyses if server-authenticated
          const listRes = await fetch('/api/analysis/list');
          if (listRes.ok) {
            const listData = await listRes.json();
            setAnalyses(listData.analyses || []);
          }
        }
      } catch (err) {
        // ignore - fallback to local storage user only
      } finally {
        setIsLoading(false);
      }
    })();

  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>;
  }

  const plan = serverUser?.subscriptionStatus ?? user.subscriptionStatus ?? 'free';
  const analysisCount = serverUser?.analysisCount ?? 0;
  const analysisLimit = serverUser?.analysisLimit ?? user.analysisLimit ?? 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Welcome, {user.name}!
            </h1>
            <p className="text-lg text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Plan: <span className="font-medium">{plan}</span></p>
          </div>
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.photoURL} alt={user.name} />
            <AvatarFallback className="text-lg font-semibold">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Cephalometric Analysis Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link href="/studio">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cephalometric Analysis</CardTitle>
                    <CardDescription>Analyze X-rays and generate reports</CardDescription>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the studio to analyze cephalometric images and generate detailed analysis reports.
                </p>
                <Button className="w-full" variant="outline">
                  Open Studio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Account / Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription & Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{plan === 'free' ? 'Free' : plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Analyses used</p>
                <p className="font-medium">{analysisCount} / {analysisLimit === null ? '∞' : analysisLimit}</p>
                <div className="w-full bg-muted h-2 rounded mt-2">
                  <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Math.floor(((analysisCount) / ((analysisLimit || 1))) * 100))}%` }} />
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/pricing"><Button variant="outline" className="flex-1">Upgrade</Button></Link>
                <Link href="/studio"><Button variant="ghost" className="flex-1">Open Studio</Button></Link>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/settings">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account</CardDescription>
                  </div>
                  <Settings className="h-8 w-8 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your profile information and account preferences.
                </p>
                <Button className="w-full" variant="outline">
                  Go to Settings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Activity / Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>Your most recent saved analyses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved analyses yet. Your analyses will appear here after you create them in the Studio.</p>
            ) : (
              <ul className="space-y-2">
                {analyses.map(a => (
                  <li key={a._id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{a.title || 'Analysis'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/studio?id=${a._id}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const effectivePlan = serverUser?.subscriptionStatus ?? user.subscriptionStatus ?? 'free';
                        if (effectivePlan === 'free') {
                          toast({ variant: 'destructive', title: 'Upgrade required', description: 'Downloads are available for paid plans only.' });
                          router.push('/pricing');
                          return;
                        }
                        // regenerate PDF client-side and download (requires export permission)
                        try {
                          const res = await fetch(`/api/analysis/list`);
                          const data = await res.json();
                          // For now simply open studio
                          router.push('/studio');
                        } catch (err) {
                          console.error(err);
                        }
                      }}>Download</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Send a message to our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <input className="w-full p-2 border rounded" placeholder="Subject" value={supportState.subject} onChange={(e) => setSupportState(s => ({ ...s, subject: e.target.value }))} />
              <textarea className="w-full p-2 border rounded" rows={4} placeholder="Describe your issue" value={supportState.message} onChange={(e) => setSupportState(s => ({ ...s, message: e.target.value }))} />
              <div className="flex gap-2">
                <Button onClick={async () => {
                  setSupportState(s => ({ ...s, sending: true }));
                  try {
                    const res = await fetch('/api/support/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: supportState.subject, message: supportState.message, email: user.email, name: user.name }) });
                    if (!res.ok) throw new Error('Failed');
                    setSupportState({ subject: '', message: '', sending: false });
                    alert('Message sent');
                  } catch (err) {
                    console.error(err);
                    setSupportState(s => ({ ...s, sending: false }));
                    alert('Failed to send message');
                  }
                }} disabled={supportState.sending}>Send</Button>
                <Button variant="ghost" onClick={() => setSupportState({ subject: '', message: '', sending: false })}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-end mt-8">
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
