import React from "react";
import PDFViewer from "@/components/ReactPDFViewer";
import { getSupabaseClient } from "@/utils/supabaseClient";

export default async function ViewPDFPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseClient();
  let fileUrl: string | null | undefined;
  let fileUrlRubric: string | null | undefined;
  let title: string | null | undefined;

  if (supabase) {
    try {
      const { data: sub, error } = await supabase
        .from("assignments")
        .select("title, file_url, rubric_path")
        .eq("id", id)
        .maybeSingle();

      console.log("submission data:", sub);

      if (error) console.error("Error fetching submission:", error);

      title = (sub as { title?: string | null } | null)?.title;

      fileUrl = (sub as { file_url?: string | null } | null)?.file_url;
      fileUrl = fileUrl?.split("/assignments/")[1];
      if (fileUrl) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from("assignments")
          .createSignedUrl(fileUrl, 60);

        if (signedError) {
          console.error("Error creating signed URL:", signedError);
        } else {
          fileUrl = signedData?.signedUrl;
          console.log("Signed URL:", fileUrl);
        }
      }

      fileUrlRubric = (sub as { rubric_path?: string | null } | null)
        ?.rubric_path;
      fileUrlRubric = fileUrlRubric?.split("/rubric/")[1];
      if (fileUrlRubric) {
        const { data: signedDataRubric, error: signedErrorRubric } =
          await supabase.storage
            .from("rubric")
            .createSignedUrl(fileUrlRubric, 60);

        if (signedErrorRubric) {
          console.error(
            "Error creating signed URL for rubric:",
            signedErrorRubric
          );
        } else {
          fileUrlRubric = signedDataRubric?.signedUrl;
          console.log("Signed URL for rubric:", signedDataRubric?.signedUrl);
        }
      }
    } catch (err) {
      console.error("Error fetching submission:", err);
    }
  } else {
    console.warn("Supabase client not available on server");
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">{title}</h1>
      <PDFViewer fileUrl={fileUrl} />
      <h2 className="text-xl font-semibold mb-4">Rubric</h2>
      <PDFViewer fileUrl={fileUrlRubric} />
    </div>
  );
}
