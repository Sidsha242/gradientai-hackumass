"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSupabaseClient } from "../../utils/supabaseClient";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Authentication is not configured in this environment.");
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const user = data.user;

    // Check if user already exists in the `users` table
    if (user) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!existingUser) {
        // Insert user into the `users` table
        const { error: insertError } = await supabase.from("users").insert([
          {
            auth_user_id: user.id,
            name:
              (user.user_metadata as { full_name?: string })?.full_name ||
              "Anonymous",
            email: user.email,
            provider: "email",
            role: "student",
          },
        ]);

        if (insertError) {
          console.error("Error inserting user:", insertError.message);
        }
      }
    }

    window.location.href = "/"; // Redirect after successful login
  }

  // (Optional) Google sign-in can be added later; removed to avoid unused function lint.

  return (
    <div className="min-h-screen flex">
      {/* Left: Sign In Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 rounded shadow">
          <h1 className="text-3xl font-bold mb-2">Sign in to Gradient</h1>
          <p className="text-gray-600 mb-6">
            Access your assignments, manage submissions, and streamline grading.
          </p>

          <div className="flex flex-col gap-4 mt-2 w-80">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              className="border border-gray-300 p-2 rounded w-full mb-2"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              className="border border-gray-300 p-2 rounded w-full mb-2"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="bg-black text-white w-full py-2 rounded mb-1 hover:cursor-pointer"
              onClick={handleSignIn}
            >
              Sign In
            </button>

            {/* <button
              className="bg-white border border-gray-300 text-gray-800 w-full py-2 rounded flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="18"
                height="18"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.6 0 6.3 1.5 8.1 2.8l6-6C35.8 3 30.4 1 24 1 14.7 1 6.8 6.6 3 14.8l7 5.4C11.5 14 17 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.6c-.6 3.4-2.9 6.2-6.1 7.9l7.3 5.7C43.3 38.2 46.5 31.8 46.5 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.4 29.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7L3 14.8C1 18.9 0 23.5 0 28.2s1 9.3 3 13.4l7.4-11.9z"
                />
                <path
                  fill="#34A853"
                  d="M24 46c6.1 0 11.5-2 15.4-5.4l-7.3-5.7c-2 1.4-4.6 2.2-8.1 2.2-7 0-12.5-4.5-14.6-10.6l-7 5.4C6.8 41.4 14.7 46 24 46z"
                />
              </svg>
              Sign in with Google
            </button> */}

            {error && <p className="text-red-500">{error}</p>}

            {/* Go to Sign Up */}
            <p className="text-center mt-4 text-gray-600">
              Don’t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-indigo-600 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Offer & Selling Points */}
      <motion.div
        className="hidden md:flex w-1/2 flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 text-white relative overflow-hidden p-12"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <motion.h2
          className="text-4xl font-bold mb-6"
          id="my-font"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          Welcome to Gradent
        </motion.h2>
        <motion.ul
          className="text-lg space-y-4 max-w-md"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.18 } },
            hidden: {},
          }}
        >
          <motion.li
            variants={{
              hidden: { opacity: 0, x: 40 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <strong>AI-Powered Grading</strong>
            <div className="mt-1">
              Automated, rubric-based scoring that saves instructors time.
            </div>
          </motion.li>

          <motion.li
            variants={{
              hidden: { opacity: 0, x: 40 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <strong>Rubric-Aligned Scoring</strong>
            <div className="mt-1">
              Consistent marks following teacher-provided criteria.
            </div>
          </motion.li>

          <motion.li
            variants={{
              hidden: { opacity: 0, x: 40 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <strong>Seamless Submissions</strong>
            <div className="mt-1">
              Secure, simple PDF upload and submission for students.
            </div>
          </motion.li>

          <motion.li
            variants={{
              hidden: { opacity: 0, x: 40 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <strong>Actionable Feedback &amp; Insights</strong>
            <div className="mt-1">
              Clear explanations for lost marks and tips to improve.
            </div>
          </motion.li>
        </motion.ul>

        <div className="mt-8">
          <Link
            href="/sign-up"
            className="bg-white text-indigo-600 px-4 py-2 rounded font-semibold"
          >
            Create instructor account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
