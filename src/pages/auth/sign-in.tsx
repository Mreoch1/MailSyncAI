import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle navigation after successful sign-in
  useEffect(() => {
    // If we're already navigating, don't trigger another navigation
    if (isNavigating) {
      try {
        const from = location.state?.from?.pathname || '/dashboard';
        console.log('Navigating to:', from);
        
        // Use a longer timeout to ensure auth state is properly updated
        const timer = setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Navigation error:', err);
        setError('Failed to navigate after sign-in. Please try refreshing the page.');
        setIsNavigating(false);
      }
    }
  }, [isNavigating, navigate, location.state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isNavigating) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      console.log('Attempting sign in for:', email);
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error(signInError.message);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      console.log('Sign in successful, user:', data?.user?.id);
      // Show success message
      toast.success('Signed in successfully');
      
      // Set navigating state instead of directly navigating
      setIsNavigating(true);
    } catch (error) {
      console.error('Sign in error:', error);
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(message);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="absolute top-4 right-4 text-muted-foreground"
        asChild
      >
        <Link to="/">Back to home →</Link>
      </Button>
      <div className="flex flex-col space-y-2 text-center">
        <Mail className="mx-auto h-6 w-6" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </div>
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="m@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={loading || isNavigating}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            disabled={loading || isNavigating}
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading || isNavigating}>
          {loading ? 'Signing in...' : isNavigating ? 'Redirecting...' : 'Sign In'}
        </Button>
      </form>
      {isNavigating && (
        <div className="text-center text-sm text-muted-foreground">
          If you're not redirected automatically, <Link to="/dashboard" className="underline">click here</Link> to go to the dashboard.
        </div>
      )}
    </div>
  );
}