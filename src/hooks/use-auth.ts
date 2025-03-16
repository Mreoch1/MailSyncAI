import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('useAuth: Initializing auth state');
    
    // Get initial session
    async function getInitialSession() {
      try {
        console.log('useAuth: Getting initial session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
          setError(error);
          setSession(null); // Set to null to indicate auth failed
          return;
        }
        
        console.log('useAuth: Session retrieved:', data.session ? 'exists' : 'null');
        setSession(data.session);
      } catch (err) {
        console.error('useAuth: Unexpected error getting session:', err);
        setError(err instanceof Error ? err : new Error('Unknown auth error'));
        setSession(null); // Set to null to indicate auth failed
      }
    }
    
    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('useAuth: Auth state changed, event:', _event);
      setSession(session);
    });

    return () => {
      console.log('useAuth: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    error,
    isLoading: session === undefined,
  };
}