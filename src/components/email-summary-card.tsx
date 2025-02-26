import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EmailItem } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

type EmailSummaryCardProps = {
  title: string;
  emails: EmailItem[];
};

export function EmailSummaryCard({ title, emails }: EmailSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.subject + email.timestamp}
                className="space-y-1.5"
              >
                <h3 className="font-semibold leading-none">
                  {email.subject}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {email.preview}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{email.sender}</span>
                  <span className="mx-1">•</span>
                  <span>
                    {formatDistanceToNow(new Date(email.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}