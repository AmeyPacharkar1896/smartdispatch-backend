import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(process.env.SUPABASE_CONNECTION_STRING, process.env.SUPABASE_ANON_KEY);
