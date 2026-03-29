import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wsygeerxfdaavdtvogvy.supabase.co'
const supabaseAnonKey = 'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
