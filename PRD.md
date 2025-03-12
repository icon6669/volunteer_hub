# Volunteer Hub - Product Requirements Document

**Version: 0.6**  
**Date: March 12, 2025**

## 1. Introduction

### 1.1 Purpose
Volunteer Hub is a comprehensive platform designed to streamline the management of volunteer events and activities. It provides organizations with tools to create events, define volunteer roles, and communicate with volunteers, while offering volunteers an easy way to discover opportunities and sign up for roles that match their interests and availability.

### 1.2 Scope
This document outlines the current state of the Volunteer Hub application (version 0.6), including its features, architecture, technical specifications, and deployment options. It serves as a reference for stakeholders, developers, and users to understand the system's capabilities and limitations.

### 1.3 Definitions and Acronyms
- **RLS**: Row Level Security, a Supabase feature that restricts access to data at the database row level
- **JWT**: JSON Web Token, used for authentication
- **SPA**: Single Page Application
- **UI**: User Interface
- **UX**: User Experience

## 2. System Overview

### 2.1 System Architecture
Volunteer Hub is built as a modern web application with the following architecture:

- **Frontend**: React-based SPA with TypeScript for type safety
- **Backend**: Serverless architecture using Supabase.com hosted instance
- **Database**: PostgreSQL (provided by Supabase)
- **Authentication**: Supabase Auth with email/password and optional social login support
- **Deployment**: Docker containerization for consistent deployment across environments

### 2.2 User Roles
The system supports the following user roles:

1. **Anonymous Users**: Can view public events if allowed by system settings
2. **Registered Users**: Can view events, sign up for volunteer roles, and manage their profiles
3. **Event Owners**: Can create and manage events, define roles, and communicate with volunteers
4. **Administrators**: Have full system access, including system settings management

## 3. Current Features

### 3.1 User Authentication
- Email/password registration and login
- Account verification via email
- Password reset functionality
- Session management
- Optional social login support (Google, Facebook) configurable via system settings

### 3.2 User Profile Management
- Profile information (name, email, profile image)
- Email notification preferences
- Unread message counter
- View volunteering history

### 3.3 Event Management
- Create, edit, and delete events
- Define event details (name, description, location, start/end dates)
- View event participants
- Event ownership and access control

### 3.4 Role Management
- Create and define volunteer roles within events
- Set role capacity limits
- Track role fulfillment status
- Manage volunteer assignments

### 3.5 Volunteer Management
- Sign up for volunteer roles
- View volunteer information
- Track volunteer participation
- Manage volunteer assignments

### 3.6 Messaging System
- Event-based messaging
- Direct messaging between users
- Message read status tracking
- Email notifications for new messages (configurable)

### 3.7 System Settings
- Organization branding (name, logo, primary color)
- Authentication provider configuration
- Public event viewing settings

## 4. Technical Specifications

### 4.1 Database Schema
The application uses the following database tables:

1. **users**
   - User profiles and authentication information
   - Tracks user roles, notification preferences, and unread message counts

2. **events**
   - Event details including name, description, location, dates
   - Linked to owner (creator) via foreign key

3. **roles**
   - Volunteer roles within events
   - Includes capacity tracking and role descriptions

4. **volunteers**
   - Tracks volunteer sign-ups for specific roles
   - Links users to roles with additional volunteer information

5. **messages**
   - Stores communication between users
   - Supports event-specific and direct messaging

6. **system_settings**
   - Stores application configuration
   - Includes authentication settings and branding options

### 4.2 Security Implementation
- Row Level Security (RLS) policies for all database tables
- JWT-based authentication
- Role-based access control
- Secure password handling via Supabase Auth

### 4.3 Frontend Implementation
- React functional components with hooks
- Context API for state management
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design for mobile and desktop

### 4.4 API Integration
- Supabase JavaScript client for database operations
- Real-time subscriptions for messaging and notifications
- Type-safe database operations using generated TypeScript types

## 5. Deployment

### 5.1 Docker Deployment
- Multi-stage Dockerfile for optimized builds
- Nginx for serving static assets
- Environment variable injection at runtime
- Configurable via environment variables

### 5.2 Supabase Integration
- Exclusively uses hosted Supabase.com project instance
- No local Supabase instances for development, testing, or production
- Database migrations for schema management
- Proper TypeScript support for Supabase operations

## 6. Current Limitations and Future Enhancements

### 6.1 Current Limitations
- Limited reporting and analytics features
- Basic search functionality for events
- No calendar integration for event scheduling
- Limited customization options for event pages

### 6.2 Planned Enhancements
- Advanced search and filtering for events
- Calendar integration (iCal, Google Calendar)
- Enhanced reporting and analytics
- Mobile application versions
- Expanded notification options
- Enhanced volunteer management features

## 7. Technical Debt and Known Issues

### 7.1 Technical Debt
- Some components need refactoring for better code organization
- Test coverage could be improved
- Documentation for API endpoints needs enhancement

### 7.2 Known Issues
- Edge cases in message handling need additional testing
- Performance optimization needed for large event listings
- Mobile responsiveness improvements needed for some components

## 8. Conclusion

Volunteer Hub v0.6 provides a solid foundation for volunteer management with core features implemented and a robust technical architecture. The application is containerized for easy deployment and exclusively uses hosted Supabase for its backend needs.

This version represents a significant milestone in the development of the platform, with a focus on core functionality, security, and usability. Future versions will build upon this foundation to enhance features, improve performance, and expand capabilities.
