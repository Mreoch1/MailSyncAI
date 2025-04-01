import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailSummaryCard } from '@/components/email-summary-card';
import { EmailProviderForm } from '@/components/email-provider-form';
import { ConnectionStatus } from '@/components/connection-status';
import { getEmailSummaries } from '@/lib/api';
import { useProfile } from '@/hooks/use-profile';
import { useEmailSettings } from '@/hooks/use-email-settings';
import type { EmailSummary } from '@/types/database';
import { Mail, Calendar, Bell, Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useEmailSettings();
  const [summaries, setSummaries] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function loadSummaries() {
      try {
        const data = await getEmailSummaries();
        setSummaries(data);
      } catch (error) {
        console.error('Failed to load email summaries:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      setLoading(true);
      loadSummaries();
      refetchSettings();
    }
  }, [profile, refreshKey, refetchSettings]);

  if (profileLoading || loading || settingsLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const latestSummary = summaries[0];
  const isEmailConnected = settings?.provider && settings.provider !== '';

  return (
    <div className="space-y-6">
      {!isEmailConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center max-w-md mx-auto">
              <h3 className="text-2xl font-semibold mb-2">
                Connect Your Email
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your email provider to start receiving AI-powered summaries
              </p>
              <EmailProviderForm
                onSuccess={refreshData}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isEmailConnected && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Emails Processed
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestSummary?.stats?.total || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Meetings Found
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestSummary?.meetings?.length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Action Items
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestSummary?.action_items?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {latestSummary ? (
            <EmailSummaryCard summary={latestSummary} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-2xl font-semibold mb-2">
                    No Email Summaries Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your email is connected, but we haven't processed any emails yet. Check back soon!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}