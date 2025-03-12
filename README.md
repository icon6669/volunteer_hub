# Volunteer Management App

A web application for managing events and volunteer roles. This application allows event managers to create events, define volunteer roles, and track volunteer participation.

## Technologies Used

- React + TypeScript
- Vite
- Supabase (Database & Authentication)
- Docker
- Nginx

## Prerequisites

- Node.js 20.x or higher
- Docker
- Supabase account

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/icon6669/volunteer_hub.git
   cd volunteer_hub
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your Supabase credentials:
   ```plaintext
   VITE_SUPABASE_URL=your_hosted_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_hosted_supabase_anon_key
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

This project uses Supabase.com as its backend. We exclusively use the hosted Supabase instance - no local Supabase setup is required or supported.

1. Create a new project on [Supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Add these to your `.env` file
4. Run the database migrations:
   ```bash
   npx supabase db push
   ```

## Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t volunteer-hub .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 80:80 \
     -e VITE_SUPABASE_URL=your_hosted_supabase_project_url \
     -e VITE_SUPABASE_ANON_KEY=your_hosted_supabase_anon_key \
     --name volunteer-hub \
     volunteer-hub
   ```

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Setup

1. Create a new project in Supabase
2. Use the following SQL to set up your database tables:

```sql
-- Create events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slots INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteers table
CREATE TABLE volunteers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details