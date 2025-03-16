import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEmailSettings } from '@/hooks/use-email-settings';
import { Loader2, ExternalLink, Mail } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { updateEmailSettings } from '@/lib/api';
import { DeepSeekSettingsForm } from '@/components/gpt-settings-form';
import { SMTPConfigForm } from '@/components/smtp-config-form';
import { toast } from 'sonner';
import type { EmailSettings } from '@/types/database';
import { format, addDays } from 'date-fns';

export function SettingsPage() {
  const { settings, loading } = useEmailSettings();
  const { profile } = useProfile();
  const [saving, setSaving] = useState(false);

  const trialEndDate = profile?.trial_start_date
    ? format(addDays(new Date(profile.trial_start_date), 30), 'PPP')
    : null;

  const daysLeft = profile?.trial_start_date
    ? Math.max(
        0,
        Math.ceil(
          (addDays(new Date(profile.trial_start_date), 30).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const updates: Partial<EmailSettings> = {
        id: settings?.id,
        summary_time: formData.get('summary-time') as string,
        important_only: formData.get('important-only') === 'on',
      };

      await updateEmailSettings(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Manage your account, email, and notification preferences.
          </p>
          {profile?.subscription_tier === 'free' && (
            <Button variant="outline" asChild>
              <Link to="/subscription">
                Upgrade to Pro
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Your current plan and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium">Current Plan</h4>
              <p className="text-2xl font-bold mt-1 capitalize">
                {profile?.subscription_tier || 'Loading...'}
              </p>
              {profile?.subscription_tier === 'free' && (
                <p className="text-sm text-muted-foreground mt-1">
                  {daysLeft
                    ? `${daysLeft} days left in trial`
                    : 'Trial period ended'}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium">Features</h4>
              <ul className="mt-1 text-sm space-y-1">
                {profile?.subscription_tier === 'pro' ? (
                  <>
                    <li>✓ GPT-4 for enhanced accuracy</li>
                    <li>✓ Unlimited emails</li>
                    <li>✓ Priority support</li>
                    <li>✓ Custom processing rules</li>
                  </>
                ) : (
                  <>
                    <li>✓ GPT-3.5 for summarization</li>
                    <li>✓ Up to 50 emails/day</li>
                    <li>✓ Basic email categorization</li>
                    <li>Trial ends: {trialEndDate || 'Ended'}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-end">
            {profile?.subscription_tier === 'pro' ? (
              <Button variant="outline" className="ml-auto">
                Manage Subscription
              </Button>
            ) : (
              <Button asChild>
                <Link to="/subscription">Upgrade to Pro</Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Configure how your emails are processed and summarized.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary-time">Daily Summary Time</Label>
                <Input
                  id="summary-time"
                  name="summary-time"
                  type="time"
                  defaultValue={settings?.summary_time || "09:00"}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="important-only"
                  name="important-only"
                  defaultChecked={settings?.important_only}
                  disabled={saving}
                />
                <Label htmlFor="important-only">
                  Only summarize important emails
                </Label>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Email Settings'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose when and how you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="email-notifications" defaultChecked />
              <Label htmlFor="email-notifications">
                Email notifications
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="meeting-reminders" defaultChecked />
              <Label htmlFor="meeting-reminders">
                Meeting reminders
              </Label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Settings</CardTitle>
            <CardDescription>
              Configure how AI processes and summarizes your emails.
              {profile?.subscription_tier === 'free' && (
                <span className="block mt-1 text-yellow-500">
                  Upgrade to Pro to use GPT-4 for enhanced accuracy
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeepSeekSettingsForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>
              Configure your SMTP server for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SMTPConfigForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal & Support</CardTitle>
            <CardDescription>
              Important legal information and ways to get help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Legal Documents</h4>
                  <div className="space-y-2">
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to="/terms" className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Terms of Service
                      </Link>
                    </Button>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to="/privacy" className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Privacy Policy
                      </Link>
                    </Button>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to="/security" className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Security Policy
                      </Link>
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Support</h4>
                  <div className="space-y-2">
                    <a
                      href="mailto:support@mailsyncai.com"
                      className="flex items-center text-sm text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      support@mailsyncai.com
                    </a>
                    <p className="text-sm text-muted-foreground">
                      Response time: {profile?.subscription_tier === 'pro'
                        ? 'Within 24 hours'
                        : 'Within 48 hours'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  By using our service, you agree to our Terms of Service and Privacy Policy.
                  We take your privacy and data security seriously.
                </p>
                <p className="mt-2">
                  Email data is processed securely and in accordance with our Security Policy.
                  No sensitive email content is stored permanently.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}