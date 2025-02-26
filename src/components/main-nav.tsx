import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MainNav({
  className
}: React.HTMLAttributes<HTMLElement>) {
  const location = useLocation();

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
    >
      <Link to="/dashboard" className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <span className="font-bold">MailSyncAI</span>
      </Link>
      <Button 
        variant="ghost" 
        asChild
        className={cn(
          location.pathname === '/dashboard' && 'bg-accent'
        )}
      >
        <Link to="/dashboard">Dashboard</Link>
      </Button>
      <Button 
        variant="ghost" 
        asChild
        className={cn(location.pathname === '/settings' && 'bg-accent')}
      >
        <Link to="/settings">Settings</Link>
      </Button>
      <Button 
        variant="ghost" 
        asChild
        className={cn(location.pathname === '/subscription' && 'bg-accent')}
      >
        <Link to="/subscription">Subscription</Link>
      </Button>
    </nav>
  );
}