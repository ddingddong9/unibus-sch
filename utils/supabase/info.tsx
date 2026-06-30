const requiredEnv = (name: string): string => {
  const value = import.meta.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const extractProjectId = (url: string): string => {
  try {
    return new URL(url).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
};

export const supabaseUrl = requiredEnv("VITE_SUPABASE_URL");
export const publicAnonKey = requiredEnv("VITE_SUPABASE_ANON_KEY");
export const projectId =
  import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() || extractProjectId(supabaseUrl);
