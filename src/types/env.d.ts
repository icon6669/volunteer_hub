// Type definitions for environment variables
interface Window {
  ENV?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
}
