"use client";
import { useState, useEffect } from "react";
import { Menu, CircleUser } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/utils/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const client = getSupabaseClient();
      if (!client) return; // env not available during prerender/build

      try {
        const { data, error } = await client.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error.message);
        } else {
          setUser(data?.session?.user ?? null);
        }
      } catch (err) {
        console.error("Error fetching supabase session:", err);
      }
    }
    fetchUser();
  }, []);

  const [search, setSearch] = useState("");
  const router = useRouter();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(
      q ? `/assignments?query=${encodeURIComponent(q)}` : "/assignments"
    );
  }

  return (
    <div className="w-full">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link
          className="text-xl text-center lg:text-3xl font-bold"
          href="/"
          id="logo"
        >
          Gradient
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            className="text-lg transition hover:text-gray-900"
            href="/profile"
          >
            Profile
          </Link>
          <Link
            className="text-lg transition hover:text-gray-900"
            href="/assignments"
          >
            Browse Assignments
          </Link>
          <Link
            className="text-lg transition hover:text-gray-900"
            href="/upload"
          >
            Upload Assignment
          </Link>
        </nav>

        {/* Search */}
        <div className="hidden md:flex md:items-center md:ml-6">
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <input
              aria-label="Search assignments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments, courses, rubrics"
              className="rounded-md border px-3 py-2 text-sm w-64"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-md text-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Desktop Auth Button */}
        <div className="hidden md:block">
          {user ? (
            <Link
              className="flex items-center gap-2 bg-black text-white px-6 py-3 md:mt-0 cursor-pointer hover:bg-gray-600 rounded-md"
              id="my-font"
              href="/logout"
            >
              <CircleUser className="h-6 w-6" />
              Sign Out
            </Link>
          ) : (
            <Link
              className="bg-black text-white px-6 py-3 md:mt-0 cursor-pointer hover:bg-gray-600 rounded-md"
              id="my-font"
              href="/sign-in"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden" />
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/40 md:hidden">
            <div
              className="w-full max-w-sm mx-auto mt-20 bg-white shadow-xl py-8 px-6 flex flex-col items-center gap-4 relative"
              id="mobile-menu"
            >
              <button
                className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                &times;
              </button>
              <Link
                className="py-2 px-4 text-sm text-gray-700 w-full text-center hover:bg-gray-100"
                href="/assignments"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Assignments
              </Link>
              <Link
                className="py-2 px-4 text-sm text-gray-700 w-full text-center hover:bg-gray-100"
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                className="py-2 px-4 text-sm text-gray-700 w-full text-center hover:bg-gray-100"
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
              >
                Upload Assignment
              </Link>

              {user ? (
                <Link
                  className="bg-black text-white px-6 py-3 z-10 md:mt-0 flex items-center gap-2"
                  href="/logout"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CircleUser className="h-6 w-6" />
                  Sign Out
                </Link>
              ) : (
                <Link
                  className="bg-black text-white px-6 py-3 z-10 md:mt-0"
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
