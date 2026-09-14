/* ===========================================================
   Supabase client setup
   Fill in YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY below.
   Find these in your Supabase project: Settings > API
   =========================================================== */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Loaded via the Supabase CDN script included in every HTML page (see <head>)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
