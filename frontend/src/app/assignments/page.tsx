"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/utils/supabaseClient";
import { DEFAULT_ASSIGNMENTS } from "@/lib/defaults";

type Assignment = {
  id: number;
  title: string;
  course?: string | null;
  due_date?: string | null;
  description?: string | null;
  rubric_summary?: string | null;
};

// DEFAULT_ASSIGNMENTS is imported from shared defaults so multiple pages can reuse it

export default function AssignmentsPage() {
  const [assignments, setAssignments] =
    useState<Assignment[]>(DEFAULT_ASSIGNMENTS);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Try to fetch assignments from Supabase if configured, otherwise use defaults.
  useEffect(() => {
    let mounted = true;
    async function fetchAssignments() {
      const supabase = getSupabaseClient();
      // only fetch assignments after auth was checked to avoid unnecessary
      // requests while we may immediately redirect an unauthenticated user.
      if (!authChecked) return;
      if (!supabase) {
        // no client available (e.g., during build or env not set) — keep defaults
        return;
      }

      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("*")
          .order("id", { ascending: true });
        if (error) {
          console.error("Error fetching assignments:", error.message);
        } else if (mounted && Array.isArray(data) && data.length > 0) {
          // Map DB rows to Assignment type, but if table empty we'll still show defaults
          type DBRow = {
            id: number;
            title: string;
            course?: string | null;
            due_date?: string | null;
            description?: string | null;
            rubric_summary?: string | null;
          };
          const rows = (data as DBRow[]).map((r) => ({
            id: r.id,
            title: r.title,
            course: r.course ?? null,
            due_date: r.due_date ?? null,
            description: r.description ?? null,
            rubric_summary: r.rubric_summary ?? null,
          }));
          setAssignments(rows);
        }
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      }
    }
    fetchAssignments();
    return () => {
      mounted = false;
    };
  }, [authChecked]);

  // Ensure user is signed in before showing this page. If Supabase isn't
  // configured we skip the redirect (keeps defaults usable during build).
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    async function checkAuth() {
      if (!supabase) {
        // no supabase client (e.g., build) — mark checked so page can render
        if (mounted) setAuthChecked(true);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          // not signed in — redirect to sign-in with return URL
          router.push("/sign-in?next=/assignments");
        } else {
          if (mounted) setAuthChecked(true);
        }
      } catch (err) {
        console.error("Error checking auth for assignments page:", err);
        if (mounted) setAuthChecked(true);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:px-10" id="my-font">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        My assignments
      </h1>

      <div className="grid md:grid-cols-3 gap-x-8 gap-y-8">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <Link href={`/assignment/${a.id}`} className="block">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">{a.title}</h2>
                  <div className="text-sm text-gray-600 mb-2">
                    {a.course && <span className="mr-2">{a.course}</span>}
                    {a.due_date && (
                      <span className="mr-2">Due: {a.due_date}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                    {a.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-indigo-600 font-medium">
                    View
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
