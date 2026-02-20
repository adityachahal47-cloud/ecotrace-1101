import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseUrl.startsWith("http") ||
    supabaseAnonKey.length < 20
  ) {
    // Return a mock client that treats user as null when Supabase is not configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { message: "Supabase not configured" } }),
            }),
          }),
          order: () => ({
            range: async () => ({ data: [], error: null }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      }),
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
