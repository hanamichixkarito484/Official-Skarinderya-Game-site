/* ===========================================================
   Supabase client setup
   =========================================================== */

const SUPABASE_URL = "https://wtknypnwwzxekokggass.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0a255cG53d3p4ZWtva2dnYXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODAzMDEsImV4cCI6MjEwNDk1NjMwMX0.HjSMOMk3hBdPpKUndpnUfJpvVKvjJuHZcYCVotNeZDE";

// Loaded via the Supabase CDN script included in every HTML page (see <head>)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
