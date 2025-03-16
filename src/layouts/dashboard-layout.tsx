import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  const { session, isLoading, error: authError } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add a timeout to detect potential rendering issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // If loading takes more than 3 seconds, show error UI

    return () => clearTimeout(timer);
  }, []);

  // Handle session state
  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
    
    if (authError) {
      setError(authError.message);
    }
  }, [isLoading, authError]);

  // If not authenticated, redirect to sign-in
  if (session === null) {
    console.log('No session found, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Show loading state while checking auth
  if (isLoading || loading) {
    console.log('Dashboard layout loading...', { isLoading, loading });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // If loading finished but still no session, show error
  if (!session && !isLoading) {
    console.error('Failed to load session after timeout');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error || "We're having trouble loading your dashboard. This might be due to authentication issues."}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/sign-in'}>
            Sign In Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container flex h-16 items-center px-4">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 relative">
        <Outlet />
      </main>
    </div>
  );
}