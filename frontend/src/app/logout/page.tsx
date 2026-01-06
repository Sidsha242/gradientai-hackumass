"use client";

import { useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleLogout() {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        router.push("/sign-in"); // Redirect even if supabase isn't ready
        return;
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error logging out:", error.message);
      } else {
        router.push("/sign-in"); // Redirect to the sign-in page after logout
      }
    }

    handleLogout();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf4e9] px-10">
      <h1 className="text-3xl font-semibold">Logging out...</h1>
    </div>
  );
}
