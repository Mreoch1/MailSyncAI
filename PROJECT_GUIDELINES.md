# MailSyncAI Project Guidelines

## Project Overview

MailSyncAI is an intelligent email management application that uses DeepSeek AI to categorize, summarize, and prioritize emails. The application helps users manage their inbox more efficiently by providing AI-powered insights and organization.

### Key Features

- **Email Provider Integration**: Connect with Gmail, Outlook, Yahoo, or custom IMAP servers
- **AI-Powered Email Processing**: Categorize and summarize emails using DeepSeek AI
- **Dashboard**: View important emails, upcoming meetings, and pending tasks
- **Customizable Settings**: Configure email processing rules and notification preferences
- **Subscription Tiers**: Free trial and Pro subscription options

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database, Edge Functions)
- **AI**: DeepSeek AI for natural language processing
- **Deployment**: Netlify for hosting and CI/CD

## Development Guidelines

### Code Structure

- **src/components/**: Reusable UI components
- **src/pages/**: Page components for each route
- **src/lib/**: Utility functions and API calls
- **src/hooks/**: Custom React hooks
- **src/types/**: TypeScript type definitions
- **supabase/**: Supabase migrations and edge functions

### Coding Standards

1. **TypeScript**: Use TypeScript for all code to ensure type safety
2. **Component Structure**: Use functional components with hooks
3. **State Management**: Use React hooks for local state, Supabase for remote state
4. **Error Handling**: Implement proper error handling and user feedback
5. **Responsive Design**: Ensure all UI components work on mobile and desktop
6. **Accessibility**: Follow WCAG guidelines for accessibility

### Git Workflow

1. **Branch Naming**: Use descriptive branch names (feature/..., bugfix/..., etc.)
2. **Commit Messages**: Write clear, concise commit messages
3. **Pull Requests**: Create PRs for all changes, include description of changes
4. **Code Reviews**: All PRs should be reviewed before merging

## Project Status and Progress

### Current Status

- Basic application structure is in place
- Authentication system is working
- Email provider integration is partially implemented
- Dashboard UI is complete
- Settings and subscription pages are implemented

### Recent Updates

- Switched from OpenAI GPT to DeepSeek AI for better performance
- Implemented email connection testing functionality
- Updated subscription tiers to reflect DeepSeek AI integration
- Improved error handling for email connections

## Deployment

### Netlify Configuration

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Set in netlify.toml and Netlify dashboard

### Supabase Configuration

- **Database**: PostgreSQL database with RLS policies
- **Authentication**: Email/password and OAuth providers
- **Edge Functions**: Used for email processing and sending

## Testing

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test complete user flows

## Documentation

- **README.md**: Project overview and setup instructions
- **PROJECT_GUIDELINES.md**: This file - detailed project guidelines
- **TODO.md**: Current tasks and future plans
- **Code Comments**: Document complex logic and important decisions

## Contact

For questions or support, contact:
- **Project Lead**: [project-lead@mailsyncai.com](mailto:project-lead@mailsyncai.com)
- **Support**: [support@mailsyncai.com](mailto:support@mailsyncai.com) 