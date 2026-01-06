"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/utils/supabaseClient";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function onRubricFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setRubricFile(f);
  }

  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        if (mounted) setAuthChecked(true);
        return;
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUserId = sessionData?.session?.user?.id ?? null;
        if (!authUserId) {
          if (mounted) {
            setAuthChecked(true);
            router.push(`/sign-in?next=${encodeURIComponent("/upload")}`);
          }
          return;
        }
        const { data: userRow } = await supabase
          .from("users")
          .select("role")
          .eq("auth_user_id", authUserId)
          .maybeSingle();
        const roleLocal = userRow?.role ?? null;
        if (roleLocal && mounted) setUserRole(roleLocal);

        if (
          !roleLocal ||
          (roleLocal !== "instructor" && roleLocal !== "admin")
        ) {
          if (mounted) {
            setAuthChecked(true);
            router.push(`/sign-in?next=${encodeURIComponent("/upload")}`);
          }
          return;
        }
      } catch (err) {
        console.warn("Error loading user role:", err);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!rubricFile) {
      setError("Please upload a rubric PDF or Markdown file.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured in this environment.");
      setLoading(false);
      return;
    }

    // Re-check role before upload
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData?.session?.user?.id ?? null;
      if (!authUserId) {
        setLoading(false);
        router.push(`/sign-in?next=${encodeURIComponent("/upload")}`);
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("auth_user_id", authUserId)
        .maybeSingle();
      const roleNow = userRow?.role ?? null;
      if (!roleNow || (roleNow !== "instructor" && roleNow !== "admin")) {
        setLoading(false);
        router.push(`/sign-in?next=${encodeURIComponent("/upload")}`);
        return;
      }
      setUserRole(roleNow);
    } catch (err) {
      console.warn("Role re-check failed:", err);
      setLoading(false);
      setError("Unable to verify your role. Try signing in again.");
      return;
    }

    let fileUrl: string | null = null;

    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user)
        throw new Error("You must be signed in to upload an assignment.");

      // First, insert the assignment to get the ID
      const payload = {
        title: title.trim(),
        course: course || null,
        due_date: dueDate || null,
        description: description || null,
        rubric_path: null, // Will update after upload
        file_url: null, // Will update after upload
        created_at: new Date().toISOString(),
        created_by: user.id,
      };

      const { data: assignmentData, error: insertError } = await supabase
        .from("assignments")
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      const assignmentId = assignmentData.id;

      try {
        // Upload assignment PDF with assignmentId folder structure
        if (file) {
          const filePath = `${assignmentId}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("assignments")
            .upload(filePath, file, { upsert: false });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("assignments")
            .getPublicUrl(filePath);
          fileUrl = urlData.publicUrl || null;
        }

        // Upload rubric with assignmentId folder structure
        const rubricPath = `${assignmentId}/${rubricFile.name}`;
        const { error: rubricUploadError } = await supabase.storage
          .from("rubric")
          .upload(rubricPath, rubricFile, { upsert: false });

        if (rubricUploadError) throw rubricUploadError;

        // Get the public URL for the rubric
        const { data: rubricUrlData } = supabase.storage
          .from("rubric")
          .getPublicUrl(rubricPath);
        const rubricUrl = rubricUrlData.publicUrl || null;

        // Update the assignment with file URLs
        const { error: updateError } = await supabase
          .from("assignments")
          .update({
            rubric_path: rubricUrl, // Store full URL instead of path
            file_url: fileUrl,
          })
          .eq("id", assignmentId);

        if (updateError) throw updateError;

        setMessage("Assignment uploaded successfully.");
        setTitle("");
        setCourse("");
        setDueDate("");
        setDescription("");
        setRubricFile(null);
        setFile(null);
      } catch (uploadErr) {
        // If uploads fail, delete the assignment record
        await supabase.from("assignments").delete().eq("id", assignmentId);
        throw uploadErr;
      }
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : String(err) || "An error occurred during upload.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">
        Gradient — Upload Assignment
      </h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Course</label>
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Rubric File (PDF/Markdown)
          </label>
          <input
            type="file"
            accept="application/pdf,.md,text/markdown"
            onChange={onRubricFileChange}
            required
          />
          {rubricFile && (
            <p className="text-xs text-gray-600 mt-1">
              Selected: {rubricFile.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Assignment PDF (optional)
          </label>
          <input type="file" accept="application/pdf" onChange={onFileChange} />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Assignment"}
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
