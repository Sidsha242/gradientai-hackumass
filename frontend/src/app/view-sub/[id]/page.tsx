import React from "react";
import PDFViewer from "@/components/ReactPDFViewer";
import { getSupabaseClient } from "@/utils/supabaseClient";

export default async function ViewPDFPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabaseClient();
  let fileUrl: string | undefined = undefined;

  const { id } = await params;

  if (supabase) {
    try {
      const { data: sub, error } = await supabase
        .from("submissions")
        .select("file_path")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching submission:", error);
      }

      const filePath = (sub as { file_path?: string | null } | null)?.file_path;
      console.log("Fetched filePath:", filePath);
      if (filePath) {
        try {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("submissions")
              .createSignedUrl(filePath, 60);
          if (signedError) {
            console.error("Error creating signed URL:", signedError);
          } else {
            const sd = signedData as { signedUrl?: string } | null;
            fileUrl = sd?.signedUrl ?? undefined;
          }
        } catch (err) {
          console.error("Error creating signed URL:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching submission:", err);
    }
  } else {
    console.warn("Supabase client not available on server");
  }
  console.log("Final fileUrl:", fileUrl);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">PDF Viewer</h1>
      <PDFViewer fileUrl={fileUrl} />
    </div>
  );
}
