import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { sendTestEmail } from '@/lib/api';
import { toast } from 'sonner';

export function SMTPConfigForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Save SMTP config
      const { error: configError } = await supabase
        .from('smtp_config')
        .upsert({
          user_id: user.id,
          host: formData.get('host'),
          port: parseInt(formData.get('port') as string),
          username: formData.get('username'),
          password: formData.get('password'),
          from_email: formData.get('from_email'),
        });

      if (configError) {
        throw configError;
      }

      // Send test email
      await sendTestEmail();
      toast.success('SMTP configured and test email sent successfully');
    } catch (error) {
      console.error('SMTP config error:', error);
      toast.error('Failed to configure SMTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="host">SMTP Host</Label>
        <Input
          id="host"
          name="host"
          placeholder="smtp.mailtrap.io"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="port">SMTP Port</Label>
        <Input
          id="port"
          name="port"
          type="number"
          placeholder="587"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">SMTP Username</Label>
        <Input
          id="username"
          name="username"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">SMTP Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="from_email">From Email</Label>
        <Input
          id="from_email"
          name="from_email"
          type="email"
          placeholder="noreply@yourdomain.com"
          required
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save SMTP Configuration'}
      </Button>
      
      <div className="text-xs text-center text-muted-foreground">
        <p>For testing, you can use Mailtrap:</p>
        <p>Host: smtp.mailtrap.io</p>
        <p>Port: 587 or 2525</p>
        <p>Get credentials from mailtrap.io</p>
      </div>
    </form>
  );
}