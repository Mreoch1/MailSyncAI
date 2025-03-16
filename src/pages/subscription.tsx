import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';
import { updateProfile } from '@/lib/api';
import { toast } from 'sonner';
import type { Profile } from '@/types/database';

const plans = [
  {
    name: 'Free',
    description: '1-month trial with DeepSeek AI',
    price: '$0',
    features: [
      'DeepSeek AI for summarization',
      'Basic email categorization',
      'Up to 50 emails/day',
      'Standard response time',
      'Limited to 1 month trial',
    ],
  },
  {
    name: 'Pro',
    description: 'Premium features with advanced AI',
    price: '$9.99',
    features: [
      'Advanced DeepSeek AI processing',
      'Advanced categorization',
      'Unlimited emails',
      'Faster processing speed',
      'Priority support',
      'Custom processing rules',
      'No trial limitations',
    ],
  },
];

export function SubscriptionPage() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setCurrentPlan(profile.subscription_tier);
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleUpgrade(plan: string) {
    setLoading(true);

    try {
      const updates: Partial<Profile> = {
        id: profile?.id,
        subscription_tier: plan.toLowerCase() as Profile['subscription_tier'],
      };

      await updateProfile(updates);
      toast.success(`Successfully upgraded to ${plan} plan`);
    } catch (error) {
      toast.error('Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Start with a free trial or upgrade to Pro for advanced AI features.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-3xl font-bold">{plan.price}</div>
              <div className="text-sm text-muted-foreground">
                {plan.name === 'Free' ? 'per month for 1 month' : 'per month'}
              </div>
              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                variant={currentPlan === plan.name.toLowerCase() ? 'secondary' : 'default'}
                disabled={loading || currentPlan === plan.name.toLowerCase()}
                onClick={() => handleUpgrade(plan.name)}
              >
                {currentPlan === plan.name.toLowerCase()
                  ? 'Current Plan'
                  : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}