export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro';
  trial_start_date: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'imap';

export type EmailSettings = {
  id: string;
  user_id: string;
  provider: EmailProvider;
  imap_settings?: {
    server: string;
    port: number;
    username: string;
    password: string;
  };
  summary_time: string;
  important_only: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailSummary = {
  id: string;
  user_id: string;
  date: string;
  important_emails: EmailItem[];
  general_updates: EmailItem[];
  low_priority: EmailItem[];
  created_at: string;
};

export type EmailItem = {
  subject: string;
  sender: string;
  preview: string;
  timestamp: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type EmailBatch = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  total_emails: number;
  processed_emails: number;
  error_count: number;
  error_details: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type EmailMessage = {
  id: string;
  user_id: string;
  batch_id: string;
  message_id: string;
  thread_id: string | null;
  subject: string | null;
  sender: string;
  recipient: string;
  received_date: string;
  content_preview: string | null;
  raw_content: string | null;
  labels: string[];
  metadata: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  processing_error: string | null;
  created_at: string;
  updated_at: string;
};