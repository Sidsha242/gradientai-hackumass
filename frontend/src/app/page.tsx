"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(
      q ? `/assignments?query=${encodeURIComponent(q)}` : "/assignments"
    );
  }

  return (
    <main className="bg-white text-gray-800">
      {/* Hero */}
      <section className="relative w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
              >
                Gradient — AI grading that helps students get better
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.05 }}
                className="text-base md:text-lg max-w-xl"
              >
                Teachers upload assignment PDFs and rubrics, students submit
                completed work, and Gradient&apos;s AI grader scores submissions
                with rubric-based marks and constructive feedback — saving
                instructors time and helping students learn faster.
              </motion.p>

              <div className="flex gap-4 mt-4 text-sm text-white/90">
                <Link href="/sign-in" className="underline">
                  Teacher? Upload an assignment
                </Link>
                <span className="opacity-80">•</span>
                <a className="underline" href="#how-it-works">
                  How it works
                </a>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="order-first lg:order-last"
            >
              <div className="rounded-2xl bg-white/10 p-8 shadow-lg">
                {/* Decorative mockup */}
                <div className="h-64 w-full rounded-lg bg-gradient-to-tr from-white/30 to-white/10 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="220"
                    height="120"
                    viewBox="0 0 220 120"
                    fill="none"
                  >
                    <rect
                      width="220"
                      height="120"
                      rx="12"
                      fill="white"
                      fillOpacity="0.06"
                    />
                    <rect
                      x="12"
                      y="16"
                      width="196"
                      height="20"
                      rx="6"
                      fill="white"
                      fillOpacity="0.12"
                    />
                    <rect
                      x="12"
                      y="46"
                      width="172"
                      height="12"
                      rx="6"
                      fill="white"
                      fillOpacity="0.08"
                    />
                    <rect
                      x="12"
                      y="66"
                      width="150"
                      height="12"
                      rx="6"
                      fill="white"
                      fillOpacity="0.08"
                    />
                    <rect
                      x="12"
                      y="86"
                      width="120"
                      height="12"
                      rx="6"
                      fill="white"
                      fillOpacity="0.08"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-center">Why Gradient?</h2>
        <p className="text-center mt-2 text-gray-600 max-w-2xl mx-auto">
          A rubric-driven AI grader that delivers consistent scores and
          actionable feedback so instructors grade faster and students learn
          from detailed explanations.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold">Rubric-aligned</h3>
            <p className="mt-2 text-sm text-gray-600">
              Grading follows teacher-provided rubrics to ensure fairness and
              transparency.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold">Actionable Feedback</h3>
            <p className="mt-2 text-sm text-gray-600">
              Students receive specific reasons for lost marks and tips to
              improve.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold">Saves Instructors Time</h3>
            <p className="mt-2 text-sm text-gray-600">
              Automate initial grading and spend more time on coaching and
              review.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold">Secure & Private</h3>
            <p className="mt-2 text-sm text-gray-600">
              Student submissions are private, and data stays within your
              institution&apos;s project settings.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h3 className="text-xl font-semibold">How it works</h3>
          <p className="mt-2 text-gray-600">
            Three steps to better, faster grading.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6">
              <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="mt-4 font-medium">Upload</h4>
              <p className="mt-2 text-sm text-gray-600">
                Teachers upload assignment PDFs and the grading rubric.
              </p>
            </div>
            <div className="p-6">
              <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="mt-4 font-medium">Submit</h4>
              <p className="mt-2 text-sm text-gray-600">
                Students submit completed assignments through a secure form.
              </p>
            </div>
            <div className="p-6">
              <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="mt-4 font-medium">Grade & Explain</h4>
              <p className="mt-2 text-sm text-gray-600">
                Gradient grades against the rubric and returns a score plus
                constructive comments showing where marks were lost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social proof */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h3 className="text-2xl font-semibold text-center">Early feedback</h3>
        <p className="text-center mt-2 text-gray-600">
          What instructors and students say.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            “Cut grading time in half and the feedback was spot-on.” — Dr.
            Ramirez
          </div>
          <div className="p-6 border rounded-lg">
            “Students actually understood why they lost points — great tool.” —
            Leah
          </div>
          <div className="p-6 border rounded-lg">
            “Clear rubric alignment made grades defensible and consistent.” —
            Prof. Chen
          </div>
        </div>
      </section>
    </main>
  );
}
