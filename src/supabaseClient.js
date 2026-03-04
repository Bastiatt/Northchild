import { createClient } from '@supabase/supabase-js';

// Replace these with your actual details from the Supabase API settings
const supabaseUrl = 'https://kfjbogjidiyxieeyzeue.supabase.co';
const supabaseAnonKey = 'sb_publishable_i19TW4eGrBBK7YPWXTRc8g_0t91IYOp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);