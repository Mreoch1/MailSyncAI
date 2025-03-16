# MailSyncAI Project Guidelines

## Project Overview

MailSyncAI is an intelligent email management system that uses AI to help users organize, prioritize, and manage their inbox efficiently. The application connects to various email providers (Gmail, Outlook, Yahoo, IMAP), processes emails using AI, and presents them in a categorized, summarized format.

## Key Features

- AI-powered email categorization and summarization
- Multiple email provider support
- Smart email analytics and insights
- Customizable notification preferences
- Beautiful, responsive UI with dark mode support
- Secure email processing with end-to-end encryption

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase for database and authentication
- **AI**: DeepSeek for email processing (previously used OpenAI GPT)
- **Deployment**: Netlify for frontend hosting

## Project Structure

- `src/`: Main source code
  - `components/`: Reusable UI components
  - `hooks/`: Custom React hooks
  - `layouts/`: Page layout components
  - `lib/`: Utility functions and API clients
  - `pages/`: Main application pages
  - `routes/`: Application routing
  - `types/`: TypeScript type definitions
- `supabase/`: Supabase configuration and migrations
  - `migrations/`: Database schema migrations

## Development Workflow

1. **Setup**: Clone the repository and install dependencies
2. **Local Development**: Run the development server with `npm run dev`
3. **Database**: Use Supabase CLI for local development
4. **Testing**: Implement tests for critical functionality
5. **Deployment**: Deploy to Netlify for frontend, Supabase for backend

## Coding Standards

- Use TypeScript for type safety
- Follow ESLint rules for code quality
- Use Prettier for consistent formatting
- Write meaningful commit messages
- Document complex functions and components

## Authentication and Security

- Use Supabase for authentication
- Implement Row Level Security (RLS) for database access
- Store sensitive information in environment variables
- Validate user input on both client and server
- Use HTTPS for all API requests

## Performance Considerations

- Optimize bundle size with code splitting
- Implement lazy loading for components
- Use efficient data fetching strategies
- Optimize images and assets
- Implement caching where appropriate

## Accessibility

- Follow WCAG 2.1 guidelines
- Use semantic HTML
- Ensure keyboard navigation
- Provide alternative text for images
- Test with screen readers

## Current Status and Next Steps

The project is currently in development with the basic structure in place. The next steps include:
1. Implementing email provider authentication
2. Developing the AI email processing pipeline
3. Creating the email summary visualization
4. Building the settings and customization features
5. Implementing the subscription system 