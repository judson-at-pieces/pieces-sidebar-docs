// Check if Supabase is configured without importing the client
function checkSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'undefined' && key !== 'undefined' && url.startsWith('http'));
}

// Feature flags for controlling app behavior
export const FEATURE_FLAGS = {
  // Enable compiled MDX components instead of runtime markdown
  // Default to true when Supabase is not configured (fallback mode)
  USE_COMPILED_MDX: import.meta.env.VITE_USE_COMPILED_MDX === 'true' || !checkSupabaseConfig(),
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}