import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useProfile } from '@/hooks/use-profile';
import { Loader2 } from 'lucide-react';

export function UserNav() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <ThemeSwitcher />
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      </div>
    );
  }

  const initials = profile?.email
    ? profile.email.charAt(0).toUpperCase()
    : '?';

  return (
    <div className="flex items-center space-x-2">
      <ThemeSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile?.email || 'No email'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}