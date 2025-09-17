import { useEffect } from "react";
import { supabase } from "../constants/supabase";

export function useSupabaseAuth() {
  useEffect(() => {
    const processHash = async () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("❌ Error setting session:", error.message);
          } else {
            console.log("✅ Session stored in Supabase!");
          }

          // Limpia la URL (quita el hash)
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    };

    processHash();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔄 Auth event:", event, session);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);
}
