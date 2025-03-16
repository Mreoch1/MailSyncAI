import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { updateDeepSeekSettings } from '@/lib/api';
import { toast } from 'sonner';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Hidden default prompt - not shown to users
const DEFAULT_PROMPT = `Process my emails with these rules:

1. Categorize by Importance:
   - Urgent: Time-sensitive matters, deadlines within 24h
   - Important: Key business/personal matters
   - Normal: Regular communications
   - Low Priority: Newsletters, promotions

2. Identify Action Items:
   - Extract deadlines and due dates
   - List required responses or tasks
   - Flag meeting invitations

3. Special Instructions:
   - Mark emails from my team as important
   - Highlight financial or legal matters
   - Group similar topics together`;

const PROCESSING_INSTRUCTIONS_PLACEHOLDER = `Example:
1. Mark as Important:
   - Emails from my team (@mycompany.com)
   - Anything mentioning "urgent" or "deadline"
   - Client communications

2. Low Priority:
   - Social media notifications
   - Marketing emails
   - Weekly newsletters

3. Special Rules:
   - Flag emails about project deadlines
   - Highlight budget discussions
   - Group related project updates`;

const EXCLUDED_SENDERS_PLACEHOLDER = `Example email addresses to exclude:
newsletter@company.com
marketing@example.com
no-reply@socialmedia.com
updates@promotional.com`;

export function DeepSeekSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [excludedSenders, setExcludedSenders] = useState('');
  const [excludePromotions, setExcludePromotions] = useState(true);
  const [excludeNewsletters, setExcludeNewsletters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    setCustomPrompt('');
    setExcludedSenders('');
    setExcludePromotions(true);
    setExcludeNewsletters(false);
    setError(null);
    toast.success('Settings reset to default');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate excluded senders format
      const sendersList = excludedSenders
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      
      const invalidEmails = sendersList.filter(email => !email.includes('@'));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
      }

      // Use default prompt if custom prompt is empty
      const finalPrompt = customPrompt.trim() || DEFAULT_PROMPT;

      await updateDeepSeekSettings({
        model: 'deepseek-chat',
        custom_prompt: finalPrompt,
        excluded_senders: sendersList,
        exclude_promotions: excludePromotions,
        exclude_newsletters: excludeNewsletters,
      });
      
      toast.success('Email processing settings updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Custom Processing Instructions</Label>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="font-mono text-sm min-h-[300px]"
          placeholder={PROCESSING_INSTRUCTIONS_PLACEHOLDER}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use our default processing rules, or add your own custom instructions above.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Excluded Senders</Label>
        <Textarea
          value={excludedSenders}
          onChange={(e) => setExcludedSenders(e.target.value)}
          className="font-mono text-sm"
          rows={6}
          placeholder={EXCLUDED_SENDERS_PLACEHOLDER}
        />
        <p className="text-xs text-muted-foreground">
          Enter email addresses to skip during processing (one per line)
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Skip Promotional Emails</Label>
            <p className="text-xs text-muted-foreground">
              Don't process marketing and promotional emails
            </p>
          </div>
          <Switch
            checked={excludePromotions}
            onCheckedChange={setExcludePromotions}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Skip Newsletters</Label>
            <p className="text-xs text-muted-foreground">
              Don't process newsletter subscriptions
            </p>
          </div>
          <Switch
            checked={excludeNewsletters}
            onCheckedChange={setExcludeNewsletters}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={loading}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
      </div>
    </form>
  );
}