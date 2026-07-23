"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Trash2 } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { DocumentCard } from "./_components/DocumentCard";
import type { DocumentCardProps } from "./_components/DocumentCard";

export default function DocumentsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.documents.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
    },
  });

  const handleView = useCallback(
    (id: string) => {
      router.push(`/documents/${id}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Delete this document? This action cannot be undone.")) {
        deleteMutation.mutate({ id });
      }
    },
    [deleteMutation],
  );

  const filtered = data?.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "2rem 1.5rem",
        fontFamily: "var(--font-geist)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>My Documents</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "0.9rem" }}>
            {data?.length ?? 0} document{(data?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/scan")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
            fontFamily: "var(--font-geist)",
          }}
          type="button"
        >
          <FileText size={16} style={{ marginRight: 8 }} />
          Scan New Document
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          position: "relative",
          marginBottom: 24,
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999",
          }}
        />
        <input
          type="text"
          placeholder="Search by file name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 12px 12px 40px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            fontSize: "0.9rem",
            fontFamily: "var(--font-geist)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 260,
                borderRadius: 14,
                background: "#f3f4f6",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!filtered || filtered.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#999",
          }}
        >
          <FileText size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h3 style={{ margin: "0 0 8px", color: "#666", fontWeight: 600 }}>
            {search ? "No matching documents" : "No documents yet"}
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            {search
              ? "Try a different search term."
              : "Upload a medical document to get started."}
          </p>
        </div>
      )}

      {/* Document grid */}
      {!isLoading && filtered && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              fileName={doc.fileName}
              fileType={doc.mimeType ?? "application/pdf"}
              status={doc.status as DocumentCardProps["status"]}
              createdAt={doc.createdAt}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
