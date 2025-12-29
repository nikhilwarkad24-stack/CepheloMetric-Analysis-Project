'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, clearAuthStorage, type UserData } from '@/lib/auth';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Settings, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  useAuthProtection();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);
    setIsLoading(false);
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

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-green-600">Active</p>
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

        {/* Recent Activity / Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick guide to using Ceph Studio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Upload an Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to the studio and upload a cephalometric X-ray image
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Analyze Landmarks</h4>
                  <p className="text-sm text-muted-foreground">
                    AI will automatically detect anatomical landmarks
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Generate Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Get detailed cephalometric analysis and measurements
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Download Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your analysis as PDF or share with colleagues
                  </p>
                </div>
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
