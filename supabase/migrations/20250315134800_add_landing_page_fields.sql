-- Migration to add landing page fields to events table
-- This addresses the error when creating events without a landing page

-- Add landing page fields to events table if they don't exist
DO $$
BEGIN
    -- Check if landing_page_enabled column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'landing_page_enabled'
    ) THEN
        ALTER TABLE public.events ADD COLUMN landing_page_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    -- Check if landing_page_title column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'landing_page_title'
    ) THEN
        ALTER TABLE public.events ADD COLUMN landing_page_title TEXT;
    END IF;

    -- Check if landing_page_description column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'landing_page_description'
    ) THEN
        ALTER TABLE public.events ADD COLUMN landing_page_description TEXT;
    END IF;

    -- Check if landing_page_image column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'landing_page_image'
    ) THEN
        ALTER TABLE public.events ADD COLUMN landing_page_image TEXT;
    END IF;

    -- Check if landing_page_theme column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'landing_page_theme'
    ) THEN
        ALTER TABLE public.events ADD COLUMN landing_page_theme TEXT;
    END IF;

    -- Check if custom_url column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'custom_url'
    ) THEN
        ALTER TABLE public.events ADD COLUMN custom_url TEXT;
    END IF;
END $$;
