const SUPABASE_FALLBACK_URL = "https://example.supabase.co";
const SUPABASE_FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fallback.payload";

function isPlaceholder(value: string) {
  return value.includes("your_") || value.includes("_here");
}

export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const hasUrl = rawUrl.length > 0 && !isPlaceholder(rawUrl);
  const hasAnonKey = rawAnonKey.length > 0 && !isPlaceholder(rawAnonKey);
  const isConfigured = hasUrl && hasAnonKey;

  return {
    isConfigured,
    url: isConfigured ? rawUrl : SUPABASE_FALLBACK_URL,
    anonKey: isConfigured ? rawAnonKey : SUPABASE_FALLBACK_ANON_KEY,
  };
}