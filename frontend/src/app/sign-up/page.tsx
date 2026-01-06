"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/utils/supabaseClient";
import toast from "react-hot-toast";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [affiliation, setAffiliation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setError("Authentication is not configured in this environment.");
      return;
    }

    // Step 1: Sign up user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Step 2: Insert user info into the 'users' table
    if (data?.user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          auth_user_id: data.user.id,
          name,
          email,
          role,
          affiliation: role === "instructor" ? affiliation : null,
        },
      ]);

      if (insertError) {
        console.error("Error inserting user:", insertError.message);
      }
    }

    toast.success("Sign-up successful! Please check your email to confirm.");
    setSuccess("Check your email to confirm your sign-up.");
    router.push("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Info Panel */}
      <div className="hidden md:flex w-full md:w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
        <div className="p-10 max-w-sm">
          <h2 className="text-2xl font-bold mb-4">
            Create an account for Gradient
          </h2>
          <p className="text-sm text-white/90">
            Sign up as a student to submit assignments or as an instructor to
            upload and manage grading.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 rounded shadow">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Create your Gradient account
          </h1>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "student" | "instructor")
                }
                className="w-full p-2 border rounded mt-1"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            {role === "instructor" && (
              <input
                type="text"
                placeholder="Department or Affiliation (optional)"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Create account"}
            </button>
          </form>

          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
          {success && <p className="mt-4 text-green-600 text-sm">{success}</p>}

          <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a href="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
