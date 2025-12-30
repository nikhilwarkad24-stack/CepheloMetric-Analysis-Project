'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, clearAuthStorage, type UserData } from '@/lib/auth';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  useAuthProtection();
  
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userdata = getUserFromStorage();
    setUser(userdata);
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

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/studio" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Studio</span>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

          {/* User Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
                  <p className="text-sm mt-2">Subscription: <span className="font-medium">{user.subscriptionStatus ?? 'free'}</span></p>
                  {user.subscriptionStatus !== 'premium' && (
                    <div className="mt-2">
                      <Button asChild size="sm">
                        <Link href="/pricing">Upgrade</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Email Notifications</p>
                <p className="text-sm text-muted-foreground mb-3">
                  You will receive notifications about your analysis results.
                </p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 border-destructive">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You will be redirected to the login page.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
