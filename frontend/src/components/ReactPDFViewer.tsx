"use client";

import { useState, useEffect } from "react";

export default function PDFViewer({ fileUrl }: { fileUrl?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl) setUrl(fileUrl);
    else setUrl(null);
  }, [fileUrl]);

  return (
    <div className="flex flex-col items-center p-4">
      {url ? (
        <iframe
          src={url}
          width="100%"
          height="800px"
          className="rounded-xl shadow-lg border border-gray-300"
          title="PDF Viewer"
        />
      ) : (
        <p>No file selected or unable to create signed URL.</p>
      )}
    </div>
  );
}
