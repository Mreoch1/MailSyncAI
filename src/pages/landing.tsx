import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, Bot } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background to-muted overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <Mail className="h-6 w-6" />
            <span className="font-bold">MailSyncAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center justify-center py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-[800px] flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="gradient-text gradient-text-primary text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-shadow-lg">
                  Your Inbox, Intelligently Organized
                </h1>
                <p className="mx-auto max-w-[600px] text-base text-foreground font-medium sm:text-lg md:text-xl text-shadow">
                  Let AI handle your email organization. Get smart summaries, automated scheduling,
                  and never miss important messages again.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link to="/sign-up">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="feature-card flex flex-col items-center space-y-4 text-center p-6 rounded-lg">
                <Mail className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Smart Email Summaries</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Daily AI-powered summaries of your most important emails
                </p>
              </div>
              <div className="feature-card flex flex-col items-center space-y-4 text-center p-6 rounded-lg">
                <Calendar className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Automated Scheduling</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Seamlessly detect and schedule meetings from your emails
                </p>
              </div>
              <div className="feature-card flex flex-col items-center space-y-4 text-center p-6 rounded-lg">
                <Bot className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Smart filtering and prioritization of your messages
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto flex flex-col items-center gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-xs text-muted-foreground">
            © 2024 MailSyncAI. All rights reserved.
          </p>
          <nav className="flex gap-4 md:ml-auto md:gap-6">
            <Link className="text-xs text-muted-foreground hover:underline underline-offset-4" to="#">
              Terms of Service
            </Link>
            <Link className="text-xs text-muted-foreground hover:underline underline-offset-4" to="#">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}