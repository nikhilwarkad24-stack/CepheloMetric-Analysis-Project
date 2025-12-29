'use client';

import { UserList } from '@/components/user-list';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function AdminPageClient() {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-foreground">Ceph Studio - Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 container py-12 md:py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-start space-y-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-4xl md:text-5xl">
                  User Management
              </h1>
              <p className="text-lg text-muted-foreground">
                  A list of all users who have registered in the application.
              </p>
          </div>
          <div className="pt-8">
              <UserList />
          </div>
        </main>
      </div>
    );
}
