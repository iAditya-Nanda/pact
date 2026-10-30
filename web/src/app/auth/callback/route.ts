import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const user = data.session.user;
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      // Update user_profiles with Google OAuth tokens and metadata
      if (user) {
        await supabase
          .from("user_profiles")
          .upsert(
            {
              id: user.id,
              email: user.email!,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0],
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                "",
              google_access_token: providerToken || null,
              google_refresh_token: providerRefreshToken || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page or home with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
