# Penniwyse Admin Dashboard

A comprehensive React-based admin dashboard for managing the Penniwyse fintech application backend features.

## Features

- **User Management**: View, search, filter, and manage all users
- **Transaction Management**: Monitor and manage bank transactions
- **Category Management**: Configure transaction categories
- **Merchant Management**: Manage merchant profiles and metadata
- **Financial Insights**: Configure insight rules and triggers
- **Gamification**: Configure XP system, badges, and streaks
- **Subscription Management**: Manage subscriptions and billing
- **Content Management**: Manage FAQs, tutorials, and announcements
- **Analytics Dashboard**: View system metrics and analytics
- **System Settings**: Configure API keys, integrations, and security

## Tech Stack

- **React 18+** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Axios** for API calls
- **React Hook Form** + **Zod** for form validation
- **Lucide React** for icons
- **Recharts** for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:3002)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API base URL:
```
VITE_API_BASE_URL=http://localhost:3002
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, Layout)
│   ├── ui/              # Reusable UI components (Button, Input, Table, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/
│   └── api/             # API service classes
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── contexts/            # React contexts (Auth, etc.)
```

## Authentication

The dashboard uses JWT-based authentication with admin role verification. Admin users must sign in with email and password through the `/login` endpoint.

### Admin Sign In

The admin sign-in endpoint expects:
- `POST /auth/admin/signin`
- Body: `{ email: string, password: string }`
- Returns: `{ user, tokens: { accessToken, refreshToken }, message }`

All admin endpoints are protected and require a valid JWT token in the Authorization header.

## Development

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation item in `src/components/layout/Sidebar.tsx`

### Adding New API Services

1. Create a service class in `src/services/api/`
2. Use the `apiClient` instance for HTTP requests
3. Define types in `src/types/`

### Styling

The project uses Tailwind CSS with a custom design system. See `tailwind.config.js` for theme configuration.

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the backend API (default: http://localhost:3002)

## License

Private - Penniwyse Internal Tool
