"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

type Assignment = {
  id: string | number;
  title?: string | null;
  course?: string | null;
  due_date?: string | null;
  description?: string | null;
  file_url?: string | null;
  created_at?: string | null;
};

type Submission = {
  id: number;
  assignment_id?: string | number | null;
  file_path?: string | null;
  file_url?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  comment?: string | null;
};

type AssignmentStats = Record<
  string | number,
  { total: number; graded: number }
>;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  graded: "bg-green-100 text-green-800",
  needs_revision: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  graded: "Graded",
  needs_revision: "Needs revision",
  rejected: "Rejected",
};

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingAssignmentId, setGradingAssignmentId] = useState<
    string | number | null
  >(null);
  const [gradingMessage, setGradingMessage] = useState<string | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<
    string | number | null
  >(null);

  const router = useRouter();
  const supabase = getSupabaseClient();

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) console.error(error.message);

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    }

    loadSession();

    const { data: listener } = supabase?.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setSession(session);
      }
    ) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch user profile and related data
  useEffect(() => {
    if (!session?.user || !supabase) return;
    const sb = supabase!;

    let mounted = true;
    const userId = session.user.id;

    async function fetchSubmissionsByAuthId() {
      try {
        const { data, error } = await sb
          .from("submissions")
          .select(
            "id, assignment_id, file_path, file_url, status, submitted_at, comment"
          )
          .eq("user_id", userId)
          .order("submitted_at", { ascending: false });

        if (!error && mounted) {
          setSubmissions((data as Submission[]) || []);
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
      }
    }

    async function fetchAssignmentStats(assignmentIds: (string | number)[]) {
      if (assignmentIds.length === 0) return;

      try {
        console.log("Fetching stats for assignment IDs:", assignmentIds);

        const { data, error } = await sb
          .from("submissions")
          .select("id, assignment_id, status")
          .in("assignment_id", assignmentIds);

        console.log("Submissions data received:", data);
        console.log("Submissions error:", error);

        if (!error && data && mounted) {
          const stats: AssignmentStats = {};
          data.forEach((row) => {
            const aid = row.assignment_id; // Keep as-is (string or number)
            console.log(
              `Processing submission for assignment ${aid}, status: ${row.status}`
            );
            if (!stats[aid]) stats[aid] = { total: 0, graded: 0 };
            stats[aid].total += 1;
            if (row.status === "graded") stats[aid].graded += 1;
          });
          console.log("Final stats computed:", stats);
          setAssignmentStats(stats);
        }
      } catch (err) {
        console.error("Error fetching assignment stats:", err);
      }
    }

    async function fetchInstructorData(internalUserId: number) {
      try {
        // Try auth user ID first (most common setup)
        console.log("Fetching assignments for auth user ID:", userId);

        const { data, error } = await sb
          .from("assignments")
          .select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });

        console.log("Assignments fetched (auth ID):", data);
        console.log("Assignments error:", error);

        if (!error && data && data.length > 0 && mounted) {
          setAssignments(data as Assignment[]);
          const assignmentIds = data.map((a) => a.id);
          console.log("Assignment IDs to fetch stats for:", assignmentIds);
          await fetchAssignmentStats(assignmentIds);
        } else if (!error && data && data.length === 0) {
          // Fallback: try internal user ID
          console.log(
            "No assignments found for auth user ID, trying internal user ID..."
          );
          const { data: altData, error: altError } = await sb
            .from("assignments")
            .select("*")
            .eq("created_by", internalUserId)
            .order("created_at", { ascending: false });

          console.log("Fallback assignments fetched (internal ID):", altData);
          if (altData && mounted) {
            setAssignments(altData as Assignment[]);
            if (altData.length > 0) {
              await fetchAssignmentStats(altData.map((a) => a.id));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    }

    async function fetchStudentData(internalUserId: number) {
      try {
        // Try auth user ID first (most common setup)
        console.log("Fetching submissions for auth user ID:", userId);

        const { data, error } = await sb
          .from("submissions")
          .select(
            "id, assignment_id, file_path, file_url, status, submitted_at, comment"
          )
          .eq("user_id", userId)
          .order("submitted_at", { ascending: false });

        console.log("Submissions fetched (auth ID):", data);

        if (!error && data && data.length > 0 && mounted) {
          setSubmissions(data as Submission[]);
        } else if (!error && data && data.length === 0) {
          // Fallback: try internal user ID
          console.log(
            "No submissions found for auth user ID, trying internal user ID..."
          );
          const { data: altData, error: altError } = await sb
            .from("submissions")
            .select(
              "id, assignment_id, file_path, file_url, status, submitted_at, comment"
            )
            .eq("user_id", internalUserId)
            .order("submitted_at", { ascending: false });

          console.log("Fallback submissions fetched (internal ID):", altData);
          if (altData && mounted) {
            setSubmissions(altData as Submission[]);
          }
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
      }
    }

    async function fetchProfileData() {
      const { data: userRow } = await sb
        .from("users")
        .select("id, name, role")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (mounted) {
        if (userRow) {
          setUserName(userRow.name || "");
          setUserRole(userRow.role || null);

          if (userRow.role === "instructor") {
            await fetchInstructorData(userRow.id);
          } else {
            await fetchStudentData(userRow.id);
          }
        } else {
          // No users row, try auth ID directly
          await fetchSubmissionsByAuthId();
        }
      }
    }

    fetchProfileData();

    return () => {
      mounted = false;
    };
  }, [session, supabase]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/sign-in?next=/profile");
    }
  }, [loading, session, router]);

  async function handleDeleteAssignment(assignment: Assignment) {
    const ok = window.confirm(
      "Delete this assignment and its file from storage? This cannot be undone."
    );
    if (!ok || !supabase) return;

    setDeletingAssignmentId(assignment.id);

    try {
      // Delete storage file if exists
      if (assignment.file_url) {
        const idx = assignment.file_url.indexOf("/assignments/");
        const storagePath =
          idx !== -1
            ? assignment.file_url.substring(idx + "/assignments/".length)
            : assignment.file_url;

        const { error: removeErr } = await supabase.storage
          .from("assignments")
          .remove([storagePath]);

        if (removeErr) {
          console.error("Failed to remove storage object:", removeErr);
        }
      }

      // Delete database row
      const { error: delError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignment.id);

      if (delError) throw delError;

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      window.alert("Failed to delete assignment. See console for details.");
    } finally {
      setDeletingAssignmentId(null);
    }
  }

  function renderStatusBadge(status: string | null | undefined) {
    const st = status ?? "pending";
    const cls = STATUS_STYLES[st] ?? "bg-gray-100 text-gray-800";
    const label = STATUS_LABELS[st] ?? st;
    return (
      <span className={`ml-3 inline-block px-2 py-0.5 rounded text-md ${cls}`}>
        {label}
      </span>
    );
  }

  function renderSubmissionStats(assignmentId: string | number) {
    const stats = assignmentStats[assignmentId] || { total: 0, graded: 0 };

    if (stats.total === 0) {
      return <span>No submissions</span>;
    }

    const allGraded = stats.graded >= stats.total;
    return (
      <span>
        {stats.total} submission{stats.total !== 1 ? "s" : ""} — {stats.graded}{" "}
        graded
        <span
          className={`ml-2 inline-block px-2 py-0.5 rounded text-xs ${
            allGraded
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {allGraded ? "All graded" : "Pending grading"}
        </span>
      </span>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 h-screen">
      <h1 className="text-2xl font-semibold text-center mb-6">Profile</h1>
      <div className="mb-6 text-center">
        Welcome{userName ? `, ${userName}` : ""}!
      </div>

      {userRole === "instructor" ? (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Assignments</h2>
            <a href="/upload" className="text-sm text-indigo-600">
              Upload Assignment
            </a>
          </div>

          {assignments.length === 0 ? (
            <p className="text-gray-600">
              You have not uploaded any assignments yet.
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {assignment.title || `Assignment ${assignment.id}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {assignment.course} • {assignment.due_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {assignment.created_at
                          ? new Date(assignment.created_at).toLocaleString()
                          : ""}
                      </div>
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          href={`/view-asg/${assignment.id}`}
                          className="text-sm text-indigo-600"
                        >
                          Open
                        </Link>
                        <div className="text-sm text-gray-600 ml-4">
                          {renderSubmissionStats(assignment.id)}
                        </div>
                        <button
                          type="button"
                          className="text-md text-white bg-red-600 px-2 py-1 rounded cursor-pointer hover:bg-red-700"
                          disabled={deletingAssignmentId === assignment.id}
                          onClick={() => handleDeleteAssignment(assignment)}
                        >
                          {deletingAssignmentId === assignment.id
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {assignment.description && (
                    <p className="mt-2 text-gray-700">
                      {assignment.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={gradingAssignmentId === assignment.id}
                      onClick={async () => {
                        const ok = window.confirm(
                          `Begin AI grading for assignment ${assignment.id}?`
                        );
                        if (!ok) return;
                        setGradingMessage(null);
                        setGradingAssignmentId(assignment.id);
                        try {
                          const endpoint =
                            process.env.NEXT_PUBLIC_AI_GRADER_URL ||
                            "http://localhost:8000/final_grading";
                          const res = await fetch(endpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              assignment_id: assignment.id,
                            }),
                          });
                          if (!res.ok) {
                            const text = await res.text();
                            throw new Error(text || res.statusText);
                          }
                          const body = await res.json().catch(() => null);
                          setGradingMessage(
                            body?.message ?? "AI grading started successfully."
                          );
                        } catch (err) {
                          console.error("AI grader start failed:", err);
                          setGradingMessage(
                            "Failed to start AI grader. See console for details."
                          );
                        } finally {
                          setGradingAssignmentId(null);
                        }
                      }}
                      className="mt-3 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg"
                    >
                      {gradingAssignmentId === assignment.id
                        ? "Starting…"
                        : "Begin AI Grader"}
                    </button>
                    {gradingMessage && (
                      <div className="mt-2 text-sm text-gray-700">
                        {gradingMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-600">
              You have not submitted any assignments yet.
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        Assignment #{submission.assignment_id}
                      </p>
                      {submission.comment && (
                        <p className="text-sm text-gray-700">
                          {submission.comment}
                        </p>
                      )}
                    </div>
                    {submission.file_path && (
                      <Link
                        href={`/view-sub/${submission.id}`}
                        className="text-sm text-indigo-600"
                      >
                        View Submission
                      </Link>
                    )}
                    <div className="text-sm text-gray-500">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    {renderStatusBadge(submission.status)}
                    {submission.status === "graded" && (
                      <Link
                        href={`/result/${encodeURIComponent(
                          String(submission.id)
                        )}`}
                        className="ml-3 inline-block bg-indigo-600 text-white px-2 py-1 rounded text-sm"
                      >
                        View Result
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
