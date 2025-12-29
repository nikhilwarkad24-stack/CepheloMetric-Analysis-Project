
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Activity, FileDown, ArrowRight, ShieldCheck, Cpu, DraftingCompass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LandingHeader } from '@/components/landing-header';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="container grid items-center gap-8 pt-20 pb-16 md:py-32 text-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Cephalometric Analysis in Seconds
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              From upload to analysis in under a minute. Our platform provides precise landmark detection, while giving you full control for manual adjustments.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/studio">
                Launch Studio <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container py-16 bg-secondary/50 rounded-t-xl">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
                <h2 className="text-3xl font-extrabold tracking-tighter sm:text-4xl md:text-5xl">A Simple, Powerful Workflow</h2>
                <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">Get from radiograph to report in three easy steps.</p>
            </div>
            <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Upload className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">1. Upload Image</h3>
                    <p className="text-muted-foreground">Securely upload your cephalometric radiograph. Your data is kept private and safe.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Activity className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">2. Place Landmarks</h3>
                    <p className="text-muted-foreground">Use our AI detection for a head start, or rely on your expertise with precise manual placement tools.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <FileDown className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">3. Generate & Export</h3>
                    <p className="text-muted-foreground">Instantly calculate dozens of measurements and export your complete analysis report.</p>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="container py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-16">
                <h2 className="text-3xl font-extrabold tracking-tighter sm:text-4xl md:text-5xl">Built for the Modern Orthodontist</h2>
                <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">Everything you need for an efficient and accurate cephalometric workflow.</p>
            </div>
            <div className="mx-auto grid justify-center gap-8 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-3">
                <Card className="flex flex-col">
                    <CardHeader className="items-center text-center">
                        <Cpu className="w-12 h-12 mb-4 text-primary" />
                        <CardTitle>AI-Powered Precision</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center">
                        <CardDescription>
                            Leverage AI for automatic landmark detection to speed up your analysis, with the ability to manually refine for complete accuracy.
                        </CardDescription>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader className="items-center text-center">
                        <DraftingCompass className="w-12 h-12 mb-4 text-primary" />
                        <CardTitle>Comprehensive Analyses</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center">
                        <CardDescription>
                            Get instant calculations for Steiner, Ricketts, McNamara, and more. All done securely in your browser.
                        </CardDescription>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader className="items-center text-center">
                        <ShieldCheck className="w-12 h-12 mb-4 text-primary" />
                        <CardTitle>Secure & Private</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center">
                        <CardDescription>
                            Your data stays with you. All computations happen in your browser with military-grade encryption.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
    </div>
  );
}
