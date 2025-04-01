import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/api';
import { toast } from 'sonner';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle navigation after successful sign-up
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        navigate('/sign-in', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isNavigating, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isNavigating) {
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        try {
          await sendEmail('welcome', email);
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        }
      }

      toast.success('Check your email to continue sign up process');
      setIsNavigating(true);
    } catch (error) {
      console.error('Sign up error:', error);
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      toast.error(message);
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
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to create your account
        </p>
      </div>
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
          {loading ? 'Creating account...' : isNavigating ? 'Redirecting...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}