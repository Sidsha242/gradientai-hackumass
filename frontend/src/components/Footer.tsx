import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-12 pt-6 text-sm text-gray-600 mt-10">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-center md:text-left">
          <div className="font-semibold">Gradent</div>
          <div className="text-gray-500">
            Rubric-driven AI grading for instructors &amp; students.
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/assignments" className="hover:text-gray-900">
            Assignments
          </Link>
          <Link href="/upload" className="hover:text-gray-900">
            Upload
          </Link>
          <Link href="/profile" className="hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/sign-in" className="hover:text-gray-900">
            Sign in
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center md:flex-row md:justify-between">
        <p className="text-gray-500">
          © {new Date().getFullYear()} Gradent. All rights reserved.
        </p>
        <div className="mt-3 md:mt-0 text-gray-500">
          <a
            href="mailto:hello@gradent.example"
            className="hover:text-gray-900"
          >
            hello@gradent.example
          </a>
        </div>
      </div>
    </footer>
  );
}
