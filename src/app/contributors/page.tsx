
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

const contributors = [
  {
    name: 'Yash Gupta',
    role: 'Lead Developer',
    imageUrl: 'https://placehold.co/128x128.png',
    dataAiHint: 'man portrait',
  },
  {
    name: 'Aman Singh',
    role: 'UI/UX Designer',
    imageUrl: 'https://placehold.co/128x128.png',
    dataAiHint: 'man portrait',
  },
  {
    name: 'Harsh Singh',
    role: 'Backend Developer',
    imageUrl: 'https://placehold.co/128x128.png',
    dataAiHint: 'man portrait',
  },
  {
    name: 'Srishti Singh',
    role: 'Project Manager',
    imageUrl: 'https://placehold.co/128x128.png',
    dataAiHint: 'woman portrait',
  },
];

export default function ContributorsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">Ceph Studio</span>
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
      <main className="flex-1">
        <section className="container py-12 md:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Meet the Team
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              This project was made possible by a group of passionate developers and designers.
            </p>
          </div>

          <div
            className="grid grid-cols-1 gap-8 pt-12 sm:grid-cols-2 lg:grid-cols-4"
          >
            {contributors.map((contributor, index) => (
              <div key={index}>
                <Card className="text-center h-full flex flex-col">
                  <CardHeader className="items-center">
                    <Image
                      src={contributor.imageUrl}
                      alt={`Photo of ${contributor.name}`}
                      width={128}
                      height={128}
                      className="rounded-full border-4 border-primary/50"
                      data-ai-hint={contributor.dataAiHint}
                    />
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardTitle as="h3" className="text-xl">{contributor.name}</CardTitle>
                    <CardDescription className="text-primary">{contributor.role}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-sm leading-loose text-center text-muted-foreground">
                Built with passion.
            </p>
        </div>
      </footer>
    </div>
  );
}
