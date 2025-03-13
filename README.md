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

### Database Schema

The application relies on the following tables in Supabase:

1. **users** - User accounts and permissions
   - Contains `user_role` column for permission management (not the default `role` column)
   - Valid roles: 'admin', 'owner', 'manager', 'volunteer'

2. **events** - Event details and management
   - Stores information about volunteer events

3. **roles** - Volunteer role definitions
   - Defines different roles volunteers can sign up for at events

4. **volunteers** - Tracks volunteer sign-ups
   - Connects users to events and roles

5. **messages** - Communication system
   - Handles messaging between users

6. **system_settings** - Application configuration
   - Stores global application settings

### Database Setup

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

## User Role Management

The application implements a role-based access control system with the following roles:

- **Admin**: Has full access to all features and can manage all aspects of the application
- **Owner**: Can manage events, volunteers, and settings for the organization
- **Manager**: Can create and manage events and volunteer roles
- **Volunteer**: Can sign up for events and manage their own profile

User roles are stored in the `user_role` column of the `users` table. The application provides utility functions for checking user permissions in `src/utils/userRoles.ts`.

## Utility Functions

The application includes several utility functions to simplify common tasks:

### User Management

- `src/utils/userManagement.ts` - Functions for managing user roles and accounts

### System Settings

- `src/utils/systemSettings.ts` - Functions for retrieving and updating system settings
- `src/utils/settingsParser.ts` - Functions for safely parsing system settings JSON

### User Roles

- `src/utils/userRoles.ts` - Functions for checking user permissions based on roles
- `src/hooks/useUserRole.ts` - React hook for accessing user role information in components

## Docker Deployment

There are multiple ways to deploy the Volunteer Hub application using Docker:

### Option 1: Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/icon6669/volunteer_hub.git
   cd volunteer_hub
   ```

2. Create a `.env` file with your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file to include your Supabase URL and anonymous key:
   ```
   VITE_SUPABASE_URL=your_hosted_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_hosted_supabase_anon_key
   ```

3. Build and run the application using Docker Compose:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. Access the application at http://localhost:8080

5. To stop the application:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

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

### Option 3: Pulling from Docker Registry (If Available)

If the image is available in a Docker registry:

1. Pull the image:
   ```bash
   docker pull username/volunteer-hub:latest
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 80:80 \
     -e VITE_SUPABASE_URL=your_hosted_supabase_project_url \
     -e VITE_SUPABASE_ANON_KEY=your_hosted_supabase_anon_key \
     --name volunteer-hub \
     username/volunteer-hub:latest
   ```

### Docker Compose Configuration

The included `docker-compose.yml` file maps port 8080 on your host to port 80 in the container and sets up the necessary environment variables:

```yaml
services:
  volunteer-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    volumes:
      - ./data:/app/data
```

### Production Deployment Considerations

For production deployments:

1. Use specific image tags instead of `latest` for better version control
2. Set up proper SSL/TLS termination using a reverse proxy like Nginx or Traefik
3. Consider using Docker Swarm or Kubernetes for orchestration in larger deployments
4. Implement proper logging and monitoring solutions
5. Use Docker secrets or a secure environment variable management system for sensitive information

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details