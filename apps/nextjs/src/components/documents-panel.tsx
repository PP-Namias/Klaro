"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@klaro/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@klaro/ui/field";
import { Input } from "@klaro/ui/input";
import { toast } from "@klaro/ui/toast";

import { useTRPC } from "~/trpc/react";

export function DocumentsPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [fileSize, setFileSize] = useState("");

  const documentsQuery = useQuery(
    trpc.documents.list.queryOptions({
      limit: 5,
      offset: 0,
    }),
  );

  const uploadDocument = useMutation(
    trpc.documents.upload.mutationOptions({
      onSuccess: async (result) => {
        setFileName("");
        setFileSize("");
        toast.success("Document queued for analysis.");
        await queryClient.invalidateQueries(trpc.documents.pathFilter());
        if (result?.analysisId) {
          toast.message(`Analysis created: ${result.analysisId}`);
        }
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to upload documents."
            : "Could not upload the document.",
        );
      },
    }),
  );

  const deleteDocument = useMutation(
    trpc.documents.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.documents.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to delete documents."
            : "Could not delete the document.",
        );
      },
    }),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = fileName.trim();
    if (!trimmedName) {
      toast.error("File name is required.");
      return;
    }

    const parsedSize = fileSize.trim() ? Number(fileSize) : undefined;
    uploadDocument.mutate({
      fileName: trimmedName,
      mimeType: mimeType.trim() || "application/pdf",
      fileSize: Number.isFinite(parsedSize) ? parsedSize : undefined,
    });
  };

  const isUnauthorized = documentsQuery.error?.data?.code === "UNAUTHORIZED";
  const documents = documentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Quick document intake</h3>
        <p className="text-muted-foreground text-sm">
          Save a document record now and connect the real upload flow later.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="document-file-name">File name</FieldLabel>
            </FieldContent>
            <Input
              id="document-file-name"
              name="fileName"
              placeholder="lab-results-jan.pdf"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
            />
            {!fileName.trim() && uploadDocument.isError ? (
              <FieldError errors={[{ message: "File name is required." }]} />
            ) : null}
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="document-mime-type">MIME type</FieldLabel>
            </FieldContent>
            <Input
              id="document-mime-type"
              name="mimeType"
              placeholder="application/pdf"
              value={mimeType}
              onChange={(event) => setMimeType(event.target.value)}
            />
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="document-file-size">
                File size (bytes)
              </FieldLabel>
            </FieldContent>
            <Input
              id="document-file-size"
              name="fileSize"
              placeholder="120000"
              value={fileSize}
              onChange={(event) => setFileSize(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={uploadDocument.isPending}>
          {uploadDocument.isPending ? "Uploading…" : "Create document"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Recent documents</h4>
          {documentsQuery.isFetching ? (
            <span className="text-muted-foreground text-xs">Refreshing…</span>
          ) : null}
        </div>

        {isUnauthorized ? (
          <p className="text-muted-foreground text-sm">
            Sign in to see your document history.
          </p>
        ) : documentsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No documents yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-muted flex flex-col gap-2 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {doc.fileName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {doc.status.toUpperCase()} •{" "}
                      {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument.mutate({ id: doc.id })}
                  >
                    Delete
                  </Button>
                </div>
                {doc.mimeType ? (
                  <p className="text-muted-foreground text-xs">
                    {doc.mimeType}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
