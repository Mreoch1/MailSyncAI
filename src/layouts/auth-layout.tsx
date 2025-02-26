import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Mail, ArrowRight, Shield, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function AuthLayout() {
  const { session } = useAuth();
  const location = useLocation();
  const isSignUp = location.pathname === '/sign-up';

  // Redirect to dashboard if already authenticated
  if (session) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-b from-background to-muted/50">
      <div className="hidden lg:flex flex-col justify-between p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        
        <div className="relative">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-6 w-6" />
            <span className="font-bold">MailSyncAI</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text">
            {isSignUp ? "Start Managing Your Inbox Smarter" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground max-w-md">
            {isSignUp
              ? "Join thousands of users who trust MailSyncAI to organize their inbox and never miss important emails."
              : "Sign in to your account to manage your emails, view summaries, and stay organized."
            }
          </p>
          <div className="grid gap-6 max-w-sm">
            <div className="feature-card flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">AI-Powered Summaries</h3>
                <p className="text-sm text-muted-foreground">Get smart summaries of your inbox</p>
              </div>
            </div>
            <div className="feature-card flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Smart Categorization</h3>
                <p className="text-sm text-muted-foreground">Auto-organize your emails by priority</p>
              </div>
            </div>
            <div className="feature-card flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">End-to-end encrypted processing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Button variant="link" className="p-0" asChild>
              <Link to={isSignUp ? "/sign-in" : "/sign-up"}>
                {isSignUp ? "Sign in" : "Create one"}
              </Link>
            </Button>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 bg-card/50">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}