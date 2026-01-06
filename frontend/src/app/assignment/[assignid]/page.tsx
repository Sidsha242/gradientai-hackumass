"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/utils/supabaseClient";
import { DEFAULT_ASSIGNMENTS } from "@/lib/defaults";
import Link from "next/link";
import PDFViewer from "@/components/ReactPDFViewer";

type Assignment = {
  id: number;
  title: string;
  course?: string | null;
  due_date?: string | null;
  description?: string | null;
  rubric_summary?: string | null;
  file_url?: string | null;
  created_at?: string | null;
};

export default function AssignmentDetailPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const params = useParams();
  const assignid = params?.assignid;

  // Submission state
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  type SubmissionRecord = {
    id: number | string;
    file_url?: string | null;
    status?: string | null;
    submitted_at?: string | null;
    comment?: string | null;
  };
  const [userSubmission, setUserSubmission] = useState<SubmissionRecord | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function fetchAssignment() {
      if (!assignid) return;
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!supabase) {
        // fallback: load from defaults if no Supabase configured
        const idNum = Number(assignid);
        const found = DEFAULT_ASSIGNMENTS.find((d) => d.id === idNum) ?? null;
        if (mounted) setAssignment(found);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("*")
          .eq("id", assignid)
          .single();

        if (error) {
          console.error("Error fetching assignment:", error.message);
          if (mounted) setAssignment(null);
        } else {
          if (mounted) {
            setAssignment(data as Assignment);

            // Fetch signed URL for PDF
            const fileUrl = data.file_url;
            if (fileUrl) {
              const urlPath = fileUrl.split("/assignments/")[1];
              if (urlPath) {
                const { data: signedData, error: signedError } =
                  await supabase.storage
                    .from("assignments")
                    .createSignedUrl(urlPath, 3600); // 1 hour expiry

                if (signedError) {
                  console.error("Error creating signed URL:", signedError);
                } else {
                  if (mounted) setPdfUrl(signedData?.signedUrl);
                }
              }
            }
          }
        }

        // Load user's submission
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUserId = sessionData?.session?.user?.id ?? null;
          if (authUserId) {
            const { data: subData, error: subErr } = await supabase
              .from("submissions")
              .select("id, file_url, status, submitted_at, comment")
              .eq("assignment_id", assignid)
              .eq("user_id", authUserId)
              .maybeSingle();

            if (!subErr && subData) {
              if (mounted) setUserSubmission(subData as SubmissionRecord);
            }
          }
        } catch (e) {
          console.debug("Could not load user submission:", e);
        }
      } catch (err) {
        console.error("Failed to fetch assignment:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAssignment();
    return () => {
      mounted = false;
    };
  }, [assignid]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubmitMessage(null);
    setSubmitError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    const assignmentId = params?.assignid;
    if (!assignmentId || typeof assignmentId !== "string") {
      setSubmitError("Invalid assignment ID.");
      return;
    }

    if (!file) {
      setSubmitError("Please attach a PDF file before submitting.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSubmitError("Supabase is not configured in this environment.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      const userId = sessionData?.session?.user?.id ?? null;
      if (!userId)
        throw new Error("You must be signed in to submit an assignment.");

      const filePath = `submissions/${assignmentId}/${userId}/${Date.now()}_${
        file.name
      }`;
      const { error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, file, { upsert: false });

      if (uploadError)
        throw new Error("Failed to upload file: " + uploadError.message);

      const { data: urlData } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl ?? null;

      const record = {
        assignment_id: assignmentId,
        user_id: userId,
        file_path: filePath,
        file_url: fileUrl,
        comment: comment || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      // Check if resubmitting (update existing) or new submission (insert)
      if (userSubmission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from("submissions")
          .update(record)
          .eq("id", userSubmission.id);

        if (updateError)
          throw new Error(
            "Failed to update submission: " + updateError.message
          );

        setSubmitMessage("Submission updated successfully.");

        // Update local state with new submission data
        setUserSubmission({
          ...userSubmission,
          file_url: fileUrl,
          comment: comment || null,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });
      } else {
        // Insert new submission
        const { data: insertData, error: insertError } = await supabase
          .from("submissions")
          .insert([record])
          .select()
          .single();

        if (insertError)
          throw new Error("Failed to save submission: " + insertError.message);

        setSubmitMessage("Submission uploaded successfully.");

        // Update local state with new submission
        if (insertData) {
          setUserSubmission(insertData as SubmissionRecord);
        }
      }

      setFile(null);
      setComment("");
    } catch (err) {
      console.error(err);
      setSubmitError((err as Error).message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <div className="p-8 text-center">Loading assignment...</div>;
  if (!assignment)
    return <div className="p-8 text-center">Assignment not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          {assignment.course && (
            <span className="mr-3">{assignment.course}</span>
          )}
          {assignment.due_date && (
            <span className="mr-3">Due: {assignment.due_date}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {assignment.description || "No description provided."}
            </p>
          </section>

          {/* PDF Viewer Section */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Assignment Document</h2>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {pdfUrl ? (
                <PDFViewer fileUrl={pdfUrl} />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No assignment document available
                </div>
              )}
            </div>
          </section>
        </div>

        <div>
          <aside className="p-4 border rounded-md sticky top-4">
            {userSubmission && (
              <div className="mb-4 p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Your Submission</div>
                    {userSubmission.comment && (
                      <div className="text-sm text-gray-700 mt-1">
                        {userSubmission.comment}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userSubmission.submitted_at
                      ? new Date(userSubmission.submitted_at).toLocaleString()
                      : ""}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {userSubmission.file_url && (
                    <Link
                      href={`/view-sub/${userSubmission.id}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      View Submission
                    </Link>
                  )}
                  {(() => {
                    const st =
                      userSubmission.status != null ? "pending" : "graded";
                    const map: Record<string, string> = {
                      pending: "bg-gray-100 text-gray-800",
                      graded: "bg-green-100 text-green-800",
                      needs_revision: "bg-yellow-100 text-yellow-800",
                      rejected: "bg-red-100 text-red-800",
                    };
                    const labelMap: Record<string, string> = {
                      pending: "Pending",
                      graded: "Graded",
                      needs_revision: "Needs revision",
                      rejected: "Rejected",
                    };
                    const cls = map[st] ?? "bg-gray-100 text-gray-800";
                    const label = labelMap[st] ?? st;
                    return (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}
                      >
                        {label}
                      </span>
                    );
                  })()}
                  {userSubmission.status != null && (
                    <>
                      {userSubmission.status === "graded" && (
                        <Link
                          href={`/result/${encodeURIComponent(
                            String(userSubmission.id)
                          )}`}
                          className="ml-3 text-sm text-white bg-indigo-600 px-2 py-1 rounded hover:underline"
                        >
                          View Result
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {userSubmission
                    ? "Upload new file (PDF)"
                    : "Upload your submission (PDF)"}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onFileChange}
                  className="w-full text-sm"
                />
                {userSubmission && (
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading a new file will replace your previous submission
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting
                    ? userSubmission
                      ? "Resubmitting..."
                      : "Submitting..."
                    : userSubmission
                    ? "Resubmit Assignment"
                    : "Submit Assignment"}
                </button>
              </div>
            </form>

            {submitMessage && (
              <p className="mt-3 text-sm text-green-600">{submitMessage}</p>
            )}
            {submitError && (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
