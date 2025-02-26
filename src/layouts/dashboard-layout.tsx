import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Loader2 } from 'lucide-react';

export function DashboardLayout() {
  const { session } = useAuth();
  const location = useLocation();

  if (session === null) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Show loading state while checking auth
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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