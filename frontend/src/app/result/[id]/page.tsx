"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { getSupabaseClient } from "@/utils/supabaseClient";

type ResultItem = {
  question: string | number;
  score: number;
  reason?: string | null;
  details?: string | null;
};

type ResultType = {
  processing_status?: string | null;
  submission_id?: number | string | null;
  overall_score?: number | null;
  created_at?: string | null;
  overall_feedback?: string | null;
  result_json?: ResultItem[] | null;
};

// Keep the API simple: params may be a Promise (server-provided) or a plain object.
export default function ResultsPage({
  params,
}: {
  params?: Promise<unknown> | undefined;
}) {
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [requestingRegrade, setRequestingRegrade] = useState(false);
  const [regradeMessage, setRegradeMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Resolve params whether it's a Promise or plain object
      let submissionIdParam: string | undefined;
      const maybePromise = params as unknown;
      try {
        if (
          maybePromise &&
          typeof (maybePromise as Promise<{ id?: string }>)?.then === "function"
        ) {
          const resolved = await (maybePromise as Promise<{ id?: string }>);
          submissionIdParam = resolved?.id;
        } else {
          submissionIdParam = (maybePromise as { id?: string })?.id;
        }
      } catch {
        // fallback to direct access if awaiting failed
        submissionIdParam = (maybePromise as { id?: string })?.id;
      }

      if (!submissionIdParam) {
        setError("Missing submission id");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase client not configured");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("results")
          .select("*")
          .eq("submission_id", submissionIdParam)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError("No results found for this submission");
          setLoading(false);
          return;
        }

        // Parse result_json if it's a JSON string
        let parsed = data.result_json;
        if (typeof parsed === "string" && parsed) {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // leave as-is
          }
        }

        setResult({
          processing_status: data.processing_status ?? null,
          submission_id: data.submission_id ?? null,
          overall_score: data.overall_score ?? null,
          created_at: data.created_at ?? null,
          overall_feedback: data.overall_feedback ?? null,
          result_json: Array.isArray(parsed) ? parsed : null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  function toggleIndex(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "processing":
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case "failed":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const scoreColor = (score?: number | null) => {
    if (score == null) return "text-gray-700";
    const percent = score;
    if (percent >= 80) return "text-green-600";
    if (percent >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Error
          </h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No results found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Grading Results
            </h1>
            <div className="flex items-center gap-2">
              {getStatusIcon(result.processing_status)}
              <span className="text-sm font-medium text-gray-600 capitalize">
                {result.processing_status ?? "Unknown"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Submission ID</p>
              <p className="text-lg font-semibold text-gray-800">
                {result.submission_id ?? "—"}
              </p>
            </div>

            <div className="rounded-lg p-6 border-2 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600 mb-1">Overall Score</p>
              <p
                className={`text-5xl font-extrabold ${scoreColor(
                  result.overall_score
                )}`}
              >
                {result.overall_score != null ? `${result.overall_score}` : "—"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Graded On</p>
              <p className="text-lg font-semibold text-gray-800">
                {result.created_at
                  ? new Date(result.created_at).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" /> Overall Feedback
            </h3>
            <p className="text-gray-700">{result.overall_feedback ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Question Breakdown
          </h2>

          {Array.isArray(result.result_json) &&
          result.result_json.length > 0 ? (
            result.result_json.map((item: ResultItem, idx: number) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg">
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full text-left p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Question {item.question}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Click to {openIndex === idx ? "hide" : "view"} details
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-4 py-2 rounded-full border-2 ${
                        item.score >= 4
                          ? "bg-green-50 border-green-200"
                          : item.score >= 3
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <span
                        className={`text-2xl font-bold ${
                          item.score >= 4
                            ? "text-green-600"
                            : item.score >= 3
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.score > 5
                          ? `${item.score}/10`
                          : `${item.score}/5`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {openIndex === idx ? "▲" : "▼"}
                    </div>
                  </div>
                </button>

                {openIndex === idx && (
                  <div className="p-4 border-t">
                    <div className="bg-gray-50 rounded p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {item.reason ?? "No reason provided."}
                      </p>
                      {item.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-indigo-600">
                            More details
                          </summary>
                          <div className="mt-2 text-sm text-gray-700">
                            {item.details}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600">
              No question-level feedback available.
            </p>
          )}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              Back to Submissions
            </button>

            <button
              type="button"
              disabled={requestingRegrade || !result.submission_id}
              onClick={async () => {
                if (!result || !result.submission_id) return;
                const ok = window.confirm(
                  "Request a regrade for this submission? This will mark the submission as 'Needs revision'."
                );
                if (!ok) return;
                setRegradeMessage(null);
                setRequestingRegrade(true);
                try {
                  const supabase = getSupabaseClient();
                  if (!supabase)
                    throw new Error("Supabase client not configured");

                  const subId =
                    typeof result.submission_id === "string"
                      ? Number(result.submission_id)
                      : result.submission_id;

                  const { error } = await supabase
                    .from("submissions")
                    .update({ status: "needs_revision" })
                    .eq("id", subId);

                  if (error) throw error;

                  setRegradeMessage(
                    "Regrade requested — submission marked as 'needs_revision'."
                  );
                } catch (err) {
                  console.error("Request regrade failed:", err);
                  setRegradeMessage(
                    "Failed to request regrade. See console for details."
                  );
                } finally {
                  setRequestingRegrade(false);
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {requestingRegrade ? "Requesting…" : "Request regrade"}
            </button>
          </div>
          {regradeMessage && (
            <div className="mt-4 text-center text-sm text-gray-700">
              {regradeMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
