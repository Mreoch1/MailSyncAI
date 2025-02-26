import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailSummaryCard } from '@/components/email-summary-card';
import { EmailProviderForm } from '@/components/email-provider-form';
import { ConnectionStatus } from '@/components/connection-status';
import { getEmailSummaries } from '@/lib/api';
import { useProfile } from '@/hooks/use-profile';
import type { EmailSummary } from '@/types/database';
import { Mail, Calendar, Bell, Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [summaries, setSummaries] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
      loadSummaries();
    }
  }, [profile]);

  if (profileLoading || loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const latestSummary = summaries[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your email management dashboard.
            </p>
          </div>
          <ConnectionStatus />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Emails
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSummary
                ? latestSummary.important_emails.length +
                  latestSummary.general_updates.length +
                  latestSummary.low_priority.length
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Processed today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSummary?.important_emails.filter((email) =>
                email.subject.toLowerCase().includes('meeting')
              ).length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Next in 2 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Tasks
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSummary?.important_emails.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Important emails today
            </p>
          </CardContent>
        </Card>
      </div>
      
      {latestSummary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <EmailSummaryCard
            title="Important Emails"
            emails={latestSummary.important_emails}
          />
          <EmailSummaryCard
            title="General Updates"
            emails={latestSummary.general_updates}
          />
          <EmailSummaryCard
            title="Low Priority"
            emails={latestSummary.low_priority}
          />
        </div>
      ) : (
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
                onSuccess={() => window.location.reload()}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}