import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dprqwknirystyibaijjt.supabase.co';
const supabaseKey = 'test-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
