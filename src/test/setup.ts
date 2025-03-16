import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Load test environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const;

// Check for required environment variables
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables in .env.test: ${missingEnvVars.join(', ')}\n` +
    'Please ensure these variables are set with the hosted Supabase instance credentials.'
  );
}

// Map Next.js variables to Vite variables for consistency
process.env.VITE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock import.meta for Vite environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
